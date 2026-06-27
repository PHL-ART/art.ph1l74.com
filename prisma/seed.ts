import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'foto' },
      update: {},
      create: {
        name: 'Фото',
        slug: 'foto',
        description: 'Фотоэссе и репортажи',
        order: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'kino' },
      update: {},
      create: {
        name: 'Кино',
        slug: 'kino',
        description: 'Рецензии и эссе о кино',
        order: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'podkasty' },
      update: {},
      create: {
        name: 'Подкасты',
        slug: 'podkasty',
        description: 'Аудио-материалы',
        order: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'teksty' },
      update: {},
      create: {
        name: 'Тексты',
        slug: 'teksty',
        description: 'Лонгриды и эссе',
        order: 4,
      },
    }),
  ])

  const [foto, kino, podkasty, teksty] = categories

  // Tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { slug: 'longgrid' }, update: {}, create: { name: 'Лонгрид', slug: 'longgrid' } }),
    prisma.tag.upsert({ where: { slug: 'reportazh' }, update: {}, create: { name: 'Репортаж', slug: 'reportazh' } }),
    prisma.tag.upsert({ where: { slug: 'fotoreportazh' }, update: {}, create: { name: 'Фоторепортаж', slug: 'fotoreportazh' } }),
  ])

  const [longridTag, reportazhTag, fotoreportazhTag] = tags

  // Featured post
  await prisma.post.upsert({
    where: { slug: 'raydery-utrachennogo-avangarda' },
    update: {},
    create: {
      title: 'Райдеры утраченного авангарда',
      slug: 'raydery-utrachennogo-avangarda',
      body: {
        blocks: [
          {
            type: 'text',
            html: 'как частный архив плёнки вернул забытые имена ленинградского андеграунда — и почему это важно именно сейчас.',
            isLead: true,
          },
          {
            type: 'text',
            html: 'В начале 1990-х молодой фотограф Виктор Арефьев снял на плёнку всё, что видел: концерты в квартирах, собрания художников, уличные перформансы. Сотни кадров пролежали в коробках почти тридцать лет.',
          },
        ],
      },
      isFeatured: true,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-06-25'),
      categories: { connect: [{ id: foto.id }] },
      tags: { connect: [{ id: longridTag.id }] },
    },
  })

  // Recent posts
  const recentPostsData = [
    {
      title: 'город в зерне: ночная плёнка',
      slug: 'gorod-v-zerne-nochnaya-plyonka',
      coverImageKey: null,
      category: foto,
      tag: fotoreportazhTag,
      publishedAt: new Date('2026-06-20'),
      gradient: 'gradient-2.png',
    },
    {
      title: 'свет без источника',
      slug: 'svet-bez-istochnika',
      coverImageKey: null,
      category: foto,
      tag: longridTag,
      publishedAt: new Date('2026-06-18'),
      gradient: 'gradient-3.png',
    },
    {
      title: 'время без выдержки',
      slug: 'vremya-bez-vyderzhki',
      coverImageKey: null,
      category: kino,
      tag: longridTag,
      publishedAt: new Date('2026-06-15'),
      gradient: 'gradient-4.png',
    },
    {
      title: 'тихий архив',
      slug: 'tihiy-arhiv',
      coverImageKey: null,
      category: teksty,
      tag: reportazhTag,
      publishedAt: new Date('2026-06-12'),
      gradient: 'gradient-1.png',
    },
    {
      title: 'дорога к морю',
      slug: 'doroga-k-moryu',
      coverImageKey: null,
      category: foto,
      tag: fotoreportazhTag,
      publishedAt: new Date('2026-06-08'),
      gradient: 'gradient-2.png',
    },
    {
      title: 'параллельные истории',
      slug: 'parallelnye-istorii',
      coverImageKey: null,
      category: kino,
      tag: longridTag,
      publishedAt: new Date('2026-06-03'),
      gradient: 'gradient-3.png',
    },
  ]

  for (const data of recentPostsData) {
    await prisma.post.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        title: data.title,
        slug: data.slug,
        body: {
          blocks: [
            { type: 'text', html: 'Краткое описание материала.', isLead: true },
          ],
        },
        status: 'PUBLISHED',
        publishedAt: data.publishedAt,
        categories: { connect: [{ id: data.category.id }] },
        tags: { connect: [{ id: data.tag.id }] },
      },
    })
  }

  console.log('Seed completed successfully')
}

main()
  .catch(console.error)
  .finally(() => pool.end())
