import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql'
import { getConnection } from 'typeorm'
import { Post } from '../entities/Post'
import { isAuth } from '../middlewares/auth.middleware'
import { MyContext } from '../utils/types'

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(): Promise<Post[]> {
    return Post.find()
  }
  //
  @Query(() => Post)
  async post(@Arg('id') id: number): Promise<Post | undefined> {
    try {
      const result = await getConnection()
        .getRepository(Post)
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.id =:postId', { postId: id })
        .getOne()
      console.log(result)
      return result
    } catch (e) {
      console.log(e)
      return undefined
    }
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('title') title: string,
    @Arg('body') body: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const post = Post.create({ title, body, author: { id: req.session.userId } })
    await Post.insert(post)
    return post
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true }) title: string,
    @Arg('body', () => String, { nullable: true }) body: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id)

    if (!post) return null
    title ? (post.title = title) : null
    body ? (post.body = body) : null

    await Post.insert(post)
    return post
  }

  @Mutation(() => Boolean, { nullable: true })
  async deletePost(@Arg('id') id: number): Promise<boolean> {
    await Post.delete(id)
    return true
  }

  @Mutation(() => Boolean)
  async clearPosts(): Promise<boolean> {
    await Post.delete({})
    return true
  }
}
