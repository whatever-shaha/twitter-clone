import { User } from '../../entities/User'
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

//type def for User
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

  @Field(() => User, { nullable: true })
  user?: User
}
