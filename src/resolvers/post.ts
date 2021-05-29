import { MyContext } from '../utils/types'
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { Post } from '../entities/Post'

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {})
  }

  @Query(() => Post)
  post(@Arg('id') id: number, @Ctx() { em }: MyContext): Promise<Post | null> {
    return em.findOne(Post, { id })
  }

  @Mutation(() => Post)
  async createPost(
    @Arg('title') title: string,
    @Arg('body') body: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = em.create(Post, { title, body })
    await em.persistAndFlush(post)
    return post
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true }) title: string,
    @Arg('body', () => String, { nullable: true }) body: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id })

    if (!post) return null
    title ? (post.title = title) : null
    body ? (post.body = body) : null

    await em.persistAndFlush(post)
    return post
  }

  @Mutation(() => Boolean, { nullable: true })
  async deletePost(
    @Arg('id') id: number,
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    await em.nativeDelete(Post, { id })
    return true
  }

  @Mutation(() => Boolean)
  async clearPosts(@Ctx() { em }: MyContext): Promise<boolean> {
    await em.nativeDelete(Post, {})
    return true
  }
}
