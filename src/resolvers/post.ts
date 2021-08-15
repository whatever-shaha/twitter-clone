import { Arg, Mutation, Query, Resolver } from 'type-graphql'
import { Post } from '../entities/Post'

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(): Promise<Post[]> {
    return Post.find()
  }

  @Query(() => Post)
  post(@Arg('id') id: number): Promise<Post | undefined> {
    return Post.findOne(id)
  }

  @Mutation(() => Post)
  async createPost(
    @Arg('title') title: string,
    @Arg('body') body: string
  ): Promise<Post | null> {
    const post = Post.create({ title, body })
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
