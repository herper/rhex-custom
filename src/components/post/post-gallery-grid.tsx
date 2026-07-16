"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ImageIcon, ImageOff, type LucideIcon } from "lucide-react"

import { LevelIcon } from "@/components/level-icon"
import { PostListLink } from "@/components/post/post-list-link"
import { getPostTitleClassName, PostAccessBadges, PostPinBadge, PostRewardPoolIcon, PostStatusBadge, PostTypeBadge } from "@/components/post/post-list-shared"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip } from "@/components/ui/tooltip"
import { UserAvatar } from "@/components/user/user-avatar"
import { UserStatusBadge } from "@/components/user/user-status-badge"
import { VipNameTooltip } from "@/components/vip/vip-name-tooltip"
import { formatCompactNumber, formatNumber } from "@/lib/formatters"
import { buildGalleryThumbnailSrcSet, buildGalleryThumbnailUrl } from "@/lib/gallery-thumbnail"
import { getPostPath } from "@/lib/post-links"
import type { PostRewardPoolMode } from "@/lib/post-reward-pool-config"
import { cn } from "@/lib/utils"

interface PostGalleryGridProps {
  items: Array<{
    id: string
    slug: string
    title: string
    excerpt: string
    coverImage?: string | null
    typeLabel?: string
    type?: string
    status?: string
    statusLabel?: string
    reviewNote?: string | null
    pinScope?: string | null
    pinLabel?: string | null
    hasRedPacket?: boolean
    rewardMode?: PostRewardPoolMode
    minViewLevel?: number
    minViewVipLevel?: number
    isFeatured?: boolean
    boardName: string
    boardSlug?: string
    boardIcon?: string
    authorName: string
    authorUsername: string
    authorAvatarPath?: string | null
    authorStatus?: "ACTIVE" | "MUTED" | "BANNED" | "INACTIVE"
    authorIsVip?: boolean
    authorVipLevel?: number | null
    authorNameClassName?: string
    metaPrimary: string
    metaPrimaryRaw?: string
    metaSecondary?: string | null
    commentCount: number
    commentAccentColor: string
  }>
  showBoard?: boolean
  postLinkDisplayMode?: "SLUG" | "ID"
  showPinBadge?: boolean
}

function GalleryCoverPlaceholder({ label, icon: Icon = ImageIcon }: { label: string; icon?: LucideIcon }) {
  return (
    <div className="relative flex min-h-[154px] items-center justify-center bg-[linear-gradient(145deg,hsl(var(--muted)/0.78),hsl(var(--background)))] px-3 py-[2.1rem] text-muted-foreground">
      <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs backdrop-blur-sm">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
    </div>
  )
}

function GalleryCoverImage({ src, title }: { src: string; title: string }) {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [fallbackToOriginal, setFallbackToOriginal] = useState(false)
  const imageSrc = fallbackToOriginal ? src : buildGalleryThumbnailUrl(src)
  const imageSrcSet = fallbackToOriginal ? undefined : buildGalleryThumbnailSrcSet(src)

  useEffect(() => {
    setHasLoadError(false)
    setImageLoaded(false)
    setFallbackToOriginal(false)
  }, [src])

  useEffect(() => {
    const image = imageRef.current
    if (!image) {
      return
    }

    if (!image.complete) {
      return
    }

    if (image.naturalWidth > 0) {
      setImageLoaded(true)
      return
    }

    setHasLoadError(true)
    setImageLoaded(true)
  }, [imageSrc])

  if (hasLoadError) {
    return <GalleryCoverPlaceholder label="封面暂不可用" icon={ImageOff} />
  }

  return (
    <div className="relative min-h-[154px] overflow-hidden bg-secondary/40">
      {!imageLoaded ? <Skeleton aria-hidden="true" className="absolute inset-0 rounded-none" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={imageSrc}
        srcSet={imageSrcSet}
        sizes="(max-width: 1023px) 50vw, 16rem"
        alt={title}
        title={title}
        className={cn("block h-auto w-full transition-opacity duration-300", imageLoaded ? "opacity-100" : "opacity-0")}
        loading="lazy"
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          if (!fallbackToOriginal && imageSrc !== src) {
            setFallbackToOriginal(true)
            setImageLoaded(false)
            return
          }

          setHasLoadError(true)
          setImageLoaded(true)
        }}
      />
    </div>
  )
}

function PostGalleryCover({ coverImage, title }: { coverImage?: string | null; title: string }) {
  const normalizedCoverImage = coverImage?.trim() ?? ""

  if (!normalizedCoverImage) {
    return <GalleryCoverPlaceholder label="无封面图" />
  }

  return <GalleryCoverImage key={normalizedCoverImage} src={normalizedCoverImage} title={title} />
}

function resolveGalleryColumnCount(width: number, viewportWidth: number) {
  if (width <= 0) {
    return 2
  }

  if (viewportWidth < 768) {
    return 2
  }

  const targetColumnWidth = 232
  const columnGap = 8
  return Math.max(1, Math.floor((width + columnGap) / (targetColumnWidth + columnGap)))
}

function distributeGalleryItems<T>(items: T[], columnCount: number) {
  const columns = Array.from({ length: columnCount }, () => [] as T[])

  items.forEach((item, index) => {
    columns[index % columnCount]?.push(item)
  })

  return columns
}

function GalleryTitleBadges({ item, showPinBadge }: { item: PostGalleryGridProps["items"][number]; showPinBadge: boolean }) {
  const hasBadges = Boolean(
    (showPinBadge && item.pinScope) ||
    item.isFeatured ||
    (item.status && item.status !== "NORMAL") ||
    (item.type && item.type !== "NORMAL" && item.typeLabel) ||
    item.hasRedPacket,
  )

  if (!hasBadges) {
    return null
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <PostTypeBadge type={item.type} label={item.typeLabel} compact mobileIconOnly />
      <PostStatusBadge status={item.status} label={item.statusLabel} reviewNote={item.reviewNote} compact />
      {showPinBadge ? <PostPinBadge scope={item.pinScope} label={item.pinLabel} compact /> : null}
      {item.isFeatured ? <span className="inline-flex h-5 shrink-0 items-center rounded-[4px] bg-emerald-100 px-1.5 text-[10px] leading-none text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">精华</span> : null}
      {item.hasRedPacket ? (
        <Tooltip content={item.rewardMode === "JACKPOT" ? "聚宝盆帖" : "红包帖"}>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-label={item.rewardMode === "JACKPOT" ? "聚宝盆帖" : "红包帖"}>
            <PostRewardPoolIcon mode={item.rewardMode} className="h-3.5 w-3.5" />
          </span>
        </Tooltip>
      ) : null}
    </div>
  )
}

export function PostGalleryGrid({ items, showBoard = true, postLinkDisplayMode = "SLUG", showPinBadge = true }: PostGalleryGridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [columnCount, setColumnCount] = useState(2)
  const columns = distributeGalleryItems(items, columnCount)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) {
      return
    }

    const updateColumnCount = () => {
      setColumnCount((current) => {
        const nextColumnCount = resolveGalleryColumnCount(grid.clientWidth, window.innerWidth)
        return current === nextColumnCount ? current : nextColumnCount
      })
    }

    updateColumnCount()

    const observer = new ResizeObserver(updateColumnCount)
    observer.observe(grid)
    window.addEventListener("resize", updateColumnCount)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateColumnCount)
    }
  }, [])

  return (
    <div ref={gridRef} className="post-gallery-grid px-1.5 py-1.5 sm:px-2">
      {columns.map((columnItems, columnIndex) => (
        <div key={columnIndex} className="post-gallery-column">
          {columnItems.map((item) => {
        const postPath = getPostPath({ id: item.id, slug: item.slug }, { mode: postLinkDisplayMode })
        const isRestrictedAuthor = item.authorStatus === "BANNED" || item.authorStatus === "MUTED"

        return (
          <article key={item.id} className="post-gallery-card overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.025)] transition-[border-color,background-color] duration-200 hover:border-foreground/15 dark:shadow-none">
            <PostListLink href={postPath} className="block">
              <PostGalleryCover coverImage={item.coverImage} title={item.title} />
            </PostListLink>

            <div className="space-y-2 p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 overflow-hidden">
                    <GalleryTitleBadges item={item} showPinBadge={showPinBadge} />
                    <PostListLink href={postPath} visitedPath={postPath} dimWhenRead className="min-w-0 flex-1" title={item.title}>
                      <h2 className={getPostTitleClassName({ isFeatured: item.isFeatured, pinScope: item.pinScope, singleLine: true, compact: true })}>
                        {item.title}
                      </h2>
                    </PostListLink>
                    <PostAccessBadges minViewLevel={item.minViewLevel} minViewVipLevel={item.minViewVipLevel} compact />
                  </div>

                  <div className={cn("mt-2 flex min-w-0 items-center justify-between gap-1.5 overflow-hidden text-xs text-muted-foreground", isRestrictedAuthor && "grayscale")}>
                    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                      {showBoard && item.boardSlug ? (
                        <>
                          <Link href={`/boards/${item.boardSlug}`} className="flex min-w-0 max-w-[40%] items-center gap-1 font-medium hover:underline" title={item.boardName}>
                            <LevelIcon icon={item.boardIcon} className="h-3 w-3 shrink-0 text-[11px]" svgClassName="[&>svg]:block" />
                            <span className="truncate">{item.boardName}</span>
                          </Link>
                          <span className="shrink-0">•</span>
                        </>
                      ) : null}
                      <Link href={`/users/${item.authorUsername}`} className="shrink-0" title={item.authorName}>
                        <UserAvatar name={item.authorName} avatarPath={item.authorAvatarPath} size="xs" isVip={item.authorIsVip} vipLevel={item.authorVipLevel} />
                      </Link>
                      <VipNameTooltip isVip={item.authorIsVip} level={item.authorVipLevel}>
                        <Link href={`/users/${item.authorUsername}`} className={cn("min-w-0 shrink truncate font-medium", item.authorNameClassName ?? "hover:underline")} title={item.authorName}>
                          {item.authorName}
                        </Link>
                      </VipNameTooltip>
                      {isRestrictedAuthor ? <UserStatusBadge status={item.authorStatus} compact /> : null}
                    </div>
                    <PostListLink href={`${postPath}#comments`} title={`${formatNumber(item.commentCount)} 回复`} className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-[4px] px-1.5 text-[10px] font-medium leading-none tabular-nums transition-colors hover:opacity-90 sm:min-w-7 sm:text-[11px]" style={{ backgroundColor: `${item.commentAccentColor}14`, color: item.commentAccentColor }}>
                      {formatCompactNumber(item.commentCount)}
                    </PostListLink>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )
          })}
        </div>
      ))}
    </div>
  )
}
