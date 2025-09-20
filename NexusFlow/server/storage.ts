import {
  users,
  communities,
  posts,
  events,
  communityMembers,
  eventRsvp,
  comments,
  postLikes,
  notifications,
  type User,
  type UpsertUser,
  type Community,
  type InsertCommunity,
  type Post,
  type InsertPost,
  type Event,
  type InsertEvent,
  type Comment,
  type InsertComment,
  type EventRsvp,
  type InsertEventRsvp,
  type CommunityMember,
  type InsertCommunityMember,
  type Notification,
  type PostLike,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, or, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Community operations
  getCommunities(): Promise<Community[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: string, updates: Partial<InsertCommunity>): Promise<Community>;
  deleteCommunity(id: string): Promise<void>;
  getUserCommunities(userId: string): Promise<(Community & { role: string })[]>;
  
  // Community membership operations
  joinCommunity(userId: string, communityId: string, role?: string): Promise<CommunityMember>;
  leaveCommunity(userId: string, communityId: string): Promise<void>;
  getCommunityMembers(communityId: string): Promise<(CommunityMember & { user: User })[]>;
  updateMemberRole(userId: string, communityId: string, role: string): Promise<CommunityMember>;
  
  // Post operations
  getPosts(communityId?: string): Promise<(Post & { author: User; community?: Community; isLiked?: boolean })[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<InsertPost>): Promise<Post>;
  deletePost(id: string): Promise<void>;
  getUserPosts(userId: string): Promise<Post[]>;
  
  // Post interaction operations
  likePost(userId: string, postId: string): Promise<PostLike>;
  unlikePost(userId: string, postId: string): Promise<void>;
  getPostLikes(postId: string): Promise<PostLike[]>;
  
  // Comment operations
  getPostComments(postId: string): Promise<(Comment & { author: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  
  // Event operations
  getEvents(communityId?: string): Promise<(Event & { community: Community; creator: User })[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  getUserEvents(userId: string): Promise<Event[]>;
  getUpcomingEvents(): Promise<(Event & { community: Community })[]>;
  
  // RSVP operations
  rsvpEvent(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  updateRsvp(userId: string, eventId: string, status: string): Promise<EventRsvp>;
  getUserRsvps(userId: string): Promise<(EventRsvp & { event: Event })[]>;
  getEventRsvps(eventId: string): Promise<(EventRsvp & { user: User })[]>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
  getPlatformStats(): Promise<{
    totalUsers: number;
    activeCommunities: number;
    totalPosts: number;
    totalEvents: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Community operations
  async getCommunities(): Promise<Community[]> {
    return await db
      .select()
      .from(communities)
      .where(eq(communities.isApproved, true))
      .orderBy(desc(communities.memberCount));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [newCommunity] = await db.insert(communities).values(community).returning();
    
    // Auto-add creator as lead
    if (community.leadId) {
      await this.joinCommunity(community.leadId, newCommunity.id, "lead");
    }
    
    return newCommunity;
  }

  async updateCommunity(id: string, updates: Partial<InsertCommunity>): Promise<Community> {
    const [community] = await db
      .update(communities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(communities.id, id))
      .returning();
    return community;
  }

  async deleteCommunity(id: string): Promise<void> {
    await db.delete(communities).where(eq(communities.id, id));
  }

  async getUserCommunities(userId: string): Promise<(Community & { role: string })[]> {
    const result = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        leadId: communities.leadId,
        isApproved: communities.isApproved,
        memberCount: communities.memberCount,
        createdAt: communities.createdAt,
        updatedAt: communities.updatedAt,
        role: communityMembers.role,
      })
      .from(communities)
      .innerJoin(communityMembers, eq(communities.id, communityMembers.communityId))
      .where(eq(communityMembers.userId, userId));
    
    return result;
  }

  // Community membership operations
  async joinCommunity(userId: string, communityId: string, role: string = "member"): Promise<CommunityMember> {
    const [membership] = await db
      .insert(communityMembers)
      .values({ userId, communityId, role: role as "lead" | "volunteer" | "member" })
      .returning();
    
    // Update community member count
    await db
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, communityId));
    
    return membership;
  }

  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    await db
      .delete(communityMembers)
      .where(and(
        eq(communityMembers.userId, userId),
        eq(communityMembers.communityId, communityId)
      ));
    
    // Update community member count
    await db
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} - 1` })
      .where(eq(communities.id, communityId));
  }

  async getCommunityMembers(communityId: string): Promise<(CommunityMember & { user: User })[]> {
    return await db
      .select({
        id: communityMembers.id,
        communityId: communityMembers.communityId,
        userId: communityMembers.userId,
        role: communityMembers.role,
        joinedAt: communityMembers.joinedAt,
        user: users,
      })
      .from(communityMembers)
      .innerJoin(users, eq(communityMembers.userId, users.id))
      .where(eq(communityMembers.communityId, communityId));
  }

  async updateMemberRole(userId: string, communityId: string, role: string): Promise<CommunityMember> {
    const [member] = await db
      .update(communityMembers)
      .set({ role: role as "lead" | "volunteer" | "member" })
      .where(and(
        eq(communityMembers.userId, userId),
        eq(communityMembers.communityId, communityId)
      ))
      .returning();
    return member;
  }

  // Post operations
  async getPosts(communityId?: string, userId?: string): Promise<(Post & { author: User; community?: Community; isLiked?: boolean })[]> {
    let query = db
      .select({
        id: posts.id,
        userId: posts.userId,
        communityId: posts.communityId,
        content: posts.content,
        mediaUrl: posts.mediaUrl,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        sharesCount: posts.sharesCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: users,
        community: communities,
        isLiked: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${postLikes} WHERE ${postLikes.postId} = ${posts.id} AND ${postLikes.userId} = ${userId})` : sql<boolean>`false`,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .leftJoin(communities, eq(posts.communityId, communities.id));

    if (communityId) {
      query = query.where(eq(posts.communityId, communityId));
    }

    return await query.orderBy(desc(posts.createdAt));
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: string, updates: Partial<InsertPost>): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  // Post interaction operations
  async likePost(userId: string, postId: string): Promise<PostLike> {
    const [like] = await db
      .insert(postLikes)
      .values({ userId, postId })
      .returning();
    
    // Update post likes count
    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} + 1` })
      .where(eq(posts.id, postId));
    
    return like;
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await db
      .delete(postLikes)
      .where(and(
        eq(postLikes.userId, userId),
        eq(postLikes.postId, postId)
      ));
    
    // Update post likes count
    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} - 1` })
      .where(eq(posts.id, postId));
  }

  async getPostLikes(postId: string): Promise<PostLike[]> {
    return await db
      .select()
      .from(postLikes)
      .where(eq(postLikes.postId, postId));
  }

  // Comment operations
  async getPostComments(postId: string): Promise<(Comment & { author: User })[]> {
    return await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    
    // Update post comments count
    await db
      .update(posts)
      .set({ commentsCount: sql`${posts.commentsCount} + 1` })
      .where(eq(posts.id, comment.postId));
    
    return newComment;
  }

  async deleteComment(id: string): Promise<void> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (comment) {
      await db.delete(comments).where(eq(comments.id, id));
      // Update post comments count
      await db
        .update(posts)
        .set({ commentsCount: sql`${posts.commentsCount} - 1` })
        .where(eq(posts.id, comment.postId));
    }
  }

  // Event operations
  async getEvents(communityId?: string): Promise<(Event & { community: Community; creator: User })[]> {
    let query = db
      .select({
        id: events.id,
        communityId: events.communityId,
        title: events.title,
        description: events.description,
        schedule: events.schedule,
        location: events.location,
        isVirtual: events.isVirtual,
        createdBy: events.createdBy,
        attendeesCount: events.attendeesCount,
        interestedCount: events.interestedCount,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        community: communities,
        creator: users,
      })
      .from(events)
      .innerJoin(communities, eq(events.communityId, communities.id))
      .innerJoin(users, eq(events.createdBy, users.id));

    if (communityId) {
      query = query.where(eq(events.communityId, communityId));
    }

    return await query.orderBy(asc(events.schedule));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.createdBy, userId))
      .orderBy(asc(events.schedule));
  }

  async getUpcomingEvents(): Promise<(Event & { community: Community })[]> {
    return await db
      .select({
        id: events.id,
        communityId: events.communityId,
        title: events.title,
        description: events.description,
        schedule: events.schedule,
        location: events.location,
        isVirtual: events.isVirtual,
        createdBy: events.createdBy,
        attendeesCount: events.attendeesCount,
        interestedCount: events.interestedCount,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        community: communities,
      })
      .from(events)
      .innerJoin(communities, eq(events.communityId, communities.id))
      .where(sql`${events.schedule} > NOW()`)
      .orderBy(asc(events.schedule))
      .limit(10);
  }

  // RSVP operations
  async rsvpEvent(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    const [newRsvp] = await db
      .insert(eventRsvp)
      .values(rsvp)
      .onConflictDoUpdate({
        target: [eventRsvp.userId, eventRsvp.eventId],
        set: { status: rsvp.status, updatedAt: new Date() },
      })
      .returning();
    
    // Update event counts
    const counts = await db
      .select({
        going: count(sql`CASE WHEN ${eventRsvp.status} = 'going' THEN 1 END`),
        interested: count(sql`CASE WHEN ${eventRsvp.status} = 'interested' THEN 1 END`),
      })
      .from(eventRsvp)
      .where(eq(eventRsvp.eventId, rsvp.eventId));
    
    if (counts[0]) {
      await db
        .update(events)
        .set({
          attendeesCount: counts[0].going,
          interestedCount: counts[0].interested,
        })
        .where(eq(events.id, rsvp.eventId));
    }
    
    return newRsvp;
  }

  async updateRsvp(userId: string, eventId: string, status: string): Promise<EventRsvp> {
    const [rsvp] = await db
      .update(eventRsvp)
      .set({ status: status as "going" | "interested" | "not_going", updatedAt: new Date() })
      .where(and(
        eq(eventRsvp.userId, userId),
        eq(eventRsvp.eventId, eventId)
      ))
      .returning();
    return rsvp;
  }

  async getUserRsvps(userId: string): Promise<(EventRsvp & { event: Event })[]> {
    return await db
      .select({
        id: eventRsvp.id,
        eventId: eventRsvp.eventId,
        userId: eventRsvp.userId,
        status: eventRsvp.status,
        createdAt: eventRsvp.createdAt,
        updatedAt: eventRsvp.updatedAt,
        event: events,
      })
      .from(eventRsvp)
      .innerJoin(events, eq(eventRsvp.eventId, events.id))
      .where(eq(eventRsvp.userId, userId));
  }

  async getEventRsvps(eventId: string): Promise<(EventRsvp & { user: User })[]> {
    return await db
      .select({
        id: eventRsvp.id,
        eventId: eventRsvp.eventId,
        userId: eventRsvp.userId,
        status: eventRsvp.status,
        createdAt: eventRsvp.createdAt,
        updatedAt: eventRsvp.updatedAt,
        user: users,
      })
      .from(eventRsvp)
      .innerJoin(users, eq(eventRsvp.userId, users.id))
      .where(eq(eventRsvp.eventId, eventId));
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as "admin" | "staff" | "community_lead" | "volunteer" | "user", updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getPlatformStats(): Promise<{
    totalUsers: number;
    activeCommunities: number;
    totalPosts: number;
    totalEvents: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [communityCount] = await db.select({ count: count() }).from(communities).where(eq(communities.isApproved, true));
    const [postCount] = await db.select({ count: count() }).from(posts);
    const [eventCount] = await db.select({ count: count() }).from(events);

    return {
      totalUsers: userCount.count,
      activeCommunities: communityCount.count,
      totalPosts: postCount.count,
      totalEvents: eventCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
