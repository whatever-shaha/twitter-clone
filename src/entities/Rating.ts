import { Field, ObjectType } from 'type-graphql'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Post } from './Post'
import { Author } from './Author'

@ObjectType()
@Entity()
export class Rating extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.rating)
  ownerPost: Post

  @Field(() => Author)
  @ManyToOne(() => Author, (author) => author.rates)
  author: Author

  @Field(() => Boolean)
  @Column({ type: 'boolean' })
  isLike!: boolean

  @DeleteDateColumn()
  deletedDate: Date

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date
}
