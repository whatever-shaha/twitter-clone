import argon2 from 'argon2'
import dotenv from 'dotenv'
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { v4 } from 'uuid'

import { User } from '../../entities/User'
import { CHANGE_PASSWORD_URI, COOKIE_NAME } from '../../utils/constants'
import { sendEmail } from '../../utils/sendEmail'
import { MyContext } from '../../utils/types'
import { isEmail } from '../../validators/isEmail'
import {
  ChangePasswordInput,
  FieldError,
  UserResponse,
  withEmailInput,
} from './userTypes'
dotenv.config()

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext): Promise<User | undefined> {
    const id = req.session.userId
    return User.findOne(id)
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: withEmailInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    //validation for minimal lenght for password & username
    const passwordLengthRule = options.password.length <= 5
    const usernameLengthRule = options.username.length <= 2

    if (usernameLengthRule || passwordLengthRule || !isEmail(options.email)) {
      const errors: FieldError[] = []
      usernameLengthRule
        ? errors.push({
            field: 'username',
            message: 'Minimal length for username is 3',
          })
        : null
      passwordLengthRule
        ? errors.push({
            field: 'password',
            message: 'Minimal length for password is 6',
          })
        : null
      !isEmail(options.email)
        ? errors.push({
            field: 'email',
            message: 'This is not e-mail',
          })
        : null
      return { errors }
    }

    //validation for whitespaces
    if (options.username.includes(' '))
      return {
        errors: [
          {
            field: 'username',
            message: 'Username cannot include whitespaces',
          },
        ],
      }

    if (options.username.includes('@'))
      return {
        errors: [
          {
            field: 'username',
            message: 'Username cannot include "@" character',
          },
        ],
      }

    //checking whether there is any dublicates
    const candidate = await User.findOne({ where: { username: options.username } })

    if (candidate) {
      return {
        errors: [
          {
            field: 'username',
            message: 'User with this username is already exists',
          },
        ],
      }
    }

    const candidatEmail = await User.findOne({ where: { email: options.email } })

    if (candidatEmail)
      return {
        errors: [
          {
            field: 'email',
            message: 'User with this e-mail is already exists',
          },
        ],
      }

    const hashedPassword = await argon2.hash(options.password)
    const user = User.create({
      username: options.username,
      email: options.email,
      password: hashedPassword,
    })
    await User.insert(user)
    req.session.userId = user.id
    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const candidate = await User.findOne({
      where: isEmail(usernameOrEmail)
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    })

    if (!candidate) {
      return {
        errors: [{ field: 'any', message: 'wrong user input data' }],
      }
    }

    const isVerified = await argon2.verify(candidate.password, password)
    if (!isVerified) {
      return {
        errors: [{ field: 'any', message: 'wrong user input data' }],
      }
    }

    req.session.userId = candidate.id
    return { user: candidate }
  }

  @Mutation(() => Boolean)
  async passwordRecovery(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Ctx() { redis }: MyContext
  ): Promise<boolean> {
    const user = await User.findOne({
      where: isEmail(usernameOrEmail)
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    })
    if (!user) return false

    const token = v4()

    await redis.set(token, user.id)
    await sendEmail({
      sendTo: user.email,
      html: `<a href = "${process.env.HOST_URL}/${CHANGE_PASSWORD_URI}/${token}" >
                Confirm E-mail
              </a>`,
    })

    return true
  }

  @Mutation(() => UserResponse)
  async passwordChange(
    @Arg('options') options: ChangePasswordInput,
    @Ctx() { req, redis }: MyContext
  ): Promise<UserResponse> {
    //validating and then creating hashed password
    if (options.newPassword.length <= 5) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'Minimal lenth for password is 6 characters',
          },
        ],
      }
    }
    if (options.newPassword !== options.repeatNewPassword) {
      return {
        errors: [
          { field: 'repeatNewPassword', message: 'Password fields do not match' },
        ],
      }
    }
    const hashedPassword = await argon2.hash(options.newPassword)
    //////////// password is hashed ///////
    //if changing password through sending the email
    if (options.token) {
      const userId = await redis.get(options.token)
      if (!userId) {
        return {
          errors: [
            {
              field: 'token',
              message: 'URL you recived to your e-mail may have been expired',
            },
          ],
        }
      }
      const user = await User.findOne({ where: { id: userId } })
      if (!user) {
        return {
          errors: [
            {
              field: 'token',
              message: 'URL you recived to your e-mail may have been expired',
            },
          ],
        }
      }

      user.password = hashedPassword
      await User.update({ id: userId as any }, { password: hashedPassword })
      req.session.userId = user.id
      return { user }
      // if changing pass word through personal cabinet
    } else if (req.session.userId && options.currentPassword) {
      const { userId } = req.session
      const user = await User.findOne({ where: { id: userId } })
      if (!user) {
        return {
          error: { field: 'authorization', message: 'You are not authorized' },
        }
      }
      const isAuthorized = await argon2.verify(
        user.password,
        options.currentPassword
      )

      if (!isAuthorized) {
        return {
          error: { field: 'authorization', message: 'You are not authorized' },
        }
      }

      user.password = hashedPassword
      await User.update({ id: userId }, { password: hashedPassword })
      req.session.userId = user.id
      return { user }
    }
    return {
      error: { field: 'authorization', message: 'You are not authorized' },
    }
  }

  //isTokenValid
  @Query(() => Boolean)
  async isTokenValid(
    @Arg('token') token: string,
    @Ctx() { redis }: MyContext
  ): Promise<boolean> {
    //make token validation send back session to authorization
    const userId = await redis.get(token)
    if (!userId) return false
    return true
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      res.clearCookie(COOKIE_NAME)
      req.session.destroy((err) => {
        console.log('on session destroy', err)
        return err ? resolve(false) : resolve(true)
      })
    })
  }

  ///////////////////////////////////////////
  ////////dev mutations and queries//////////
  ///////////////////////////////////////////
  @Query(() => [User])
  async users(): Promise<User[]> {
    const users = await User.find()
    return users
  }

  @Mutation(() => Boolean)
  async clearUsers(): Promise<boolean> {
    await User.delete({})
    return true
  }
}
