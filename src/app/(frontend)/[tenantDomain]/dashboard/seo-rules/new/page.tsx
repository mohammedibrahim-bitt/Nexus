'use client'

import React from 'react'

import { SeoRuleForm } from '../SeoRuleForm'

export default function NewSeoRulePage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">New SEO research rule</h2>
      <SeoRuleForm />
    </div>
  )
}
