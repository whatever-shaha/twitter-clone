import argon2 from 'argon2'
import dotenv from 'dotenv'
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { User } from '../../entities/User'
import { COOKIE_NAME } from '../../utils/constants'
import { MyContext } from '../../utils/types'
import { isEmail } from '../../validators/isEmail'
import { FieldError, UserResponse, withEmailInput } from './userTypes'

dotenv.config()

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext): Promise<User | null> {
    const id = req.session.userId
    if (!id) return null
    const user = await em.findOne(User, { id })
    return user
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: withEmailInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    //validation for minimal lenght for password & username
    const passwordLengthRule = options.password.length <= 2
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
            message: 'Minimal length for password is 3',
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
    const candidate = await em.findOne(User, { username: options.username })

    if (candidate)
      return {
        errors: [
          {
            field: 'username',
            message: 'User with this username is already exists',
          },
        ],
      }

    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, {
      username: options.username,
      email: options.email,
      password: hashedPassword,
    })
    await em.persistAndFlush(user)
    req.session.userId = user.id
    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const candidate = await em.findOne(
      User,
      isEmail(usernameOrEmail)
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    )

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

  // @Mutation(() => )
  // async passwordRecovery(
  //   @Arg('usernameOrEmail') usernameOrEmail: string,
  //   @Ctx() { em }: MyContext
  // ): Promise<UserResponse> {
  //   const user = await em.findOne(
  //     User,
  //     isEmail(usernameOrEmail)
  //       ? { email: usernameOrEmail }
  //       : { username: usernameOrEmail }
  //   )
  //   if (!user) {
  //     return {
  //       errors: [
  //         {
  //           field: 'usernameOrEmail',
  //           message: 'There is no such Username or E-mail',
  //         },
  //       ],
  //     }
  //   }
  //   return:
  // }

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

  @Query(() => [User])
  async users(@Ctx() { em }: MyContext): Promise<User[]> {
    const users = await em.find(User, {})
    return users
  }

  @Mutation(() => Boolean)
  async clearUsers(@Ctx() { em }: MyContext): Promise<boolean> {
    await em.nativeDelete(User, {})
    return true
  }
}
