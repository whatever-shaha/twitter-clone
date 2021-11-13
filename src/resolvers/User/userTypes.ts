import { Author } from '../../entities/Author'
import { Field, InputType, ObjectType } from 'type-graphql'

//input type
@InputType()
export class UsernamePasswordInput {
  @Field()
  username: string

  @Field()
  password: string
}

//input type with email
@InputType()
export class withEmailInput extends UsernamePasswordInput {
  @Field()
  email: string
}

//input type for change password resolver

@InputType()
export class ChangePasswordInput {
  @Field()
  newPassword: string

  @Field()
  repeatNewPassword: string

  @Field(() => String, { nullable: true })
  token?: string

  @Field(() => String, { nullable: true })
  currentPassword?: string
}

//type def for User error
@ObjectType()
export class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

//type def for UserResponse
@ObjectType()
export class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => FieldError, { nullable: true })
  error?: FieldError

  @Field(() => Author, { nullable: true })
  user?: Author
}
