import type { CollectionBeforeValidateHook } from 'payload'

async function translateText(text: string, targetLang: 'en' | 'ar'): Promise<string> {
  if (!text || !text.trim()) return ''
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    )
    if (!res.ok) return text
    const json = await res.json()
    if (Array.isArray(json?.[0])) {
      return json[0].map((item: any) => item[0]).join('')
    }
    return text
  } catch (err) {
    console.error('Translation hook error:', err)
    return text
  }
}

export const translatePost: CollectionBeforeValidateHook = async ({ data, operation }) => {
  if (operation === 'create' || operation === 'update') {
    if (!data) return data

    // 1. Title
    if (data.titleEn && !data.titleAr) {
      data.titleAr = await translateText(data.titleEn, 'ar')
    } else if (data.titleAr && !data.titleEn) {
      data.titleEn = await translateText(data.titleAr, 'en')
    }

    // 2. Description
    if (data.descriptionEn && !data.descriptionAr) {
      data.descriptionAr = await translateText(data.descriptionEn, 'ar')
    } else if (data.descriptionAr && !data.descriptionEn) {
      data.descriptionEn = await translateText(data.descriptionAr, 'en')
    }

    // 3. Content
    if (data.contentEn && !data.contentAr) {
      data.contentAr = await translateText(data.contentEn, 'ar')
    } else if (data.contentAr && !data.contentEn) {
      data.contentEn = await translateText(data.contentAr, 'en')
    }

    // 4. Tag
    if (data.tagEn && !data.tagAr) {
      data.tagAr = await translateText(data.tagEn, 'ar')
    }

    // 5. Slug
    if (!data.slug || operation === 'create') {
      const sourceTitle = data.titleEn || data.titleAr || ''
      if (sourceTitle) {
        data.slug = sourceTitle
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-\u0600-\u06FF]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }
    }
  }
  return data
}
