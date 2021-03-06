import { Field, ObjectType } from 'type-graphql'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Author } from './Author'
import { Rating } from './Rating'

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number

  @Field(() => Author)
  @ManyToOne(() => Author, (user) => user.posts)
  author: Author

  @Field(() => Rating)
  @OneToMany(() => Rating, (rating) => rating.ownerPost)
  rating: Rating

  @Field()
  @Column()
  title!: string

  @Field()
  @Column()
  body!: string

  @Field()
  @Column({ type: 'int', default: 0 })
  likes!: number

  @Field()
  @Column({ type: 'int', default: 0 })
  dislikes!: number

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date
}
