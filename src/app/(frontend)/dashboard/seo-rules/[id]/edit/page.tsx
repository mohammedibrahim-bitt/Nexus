'use client'

import { useParams } from 'next/navigation'
import React from 'react'

import { RuleRunHistory } from '../../RuleRunHistory'
import { SeoRuleForm } from '../../SeoRuleForm'

export default function EditSeoRulePage() {
  const params = useParams<{ id: string }>()

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Edit SEO research rule</h2>
        <SeoRuleForm ruleId={params.id} />
      </div>

      <div className="flex max-w-lg flex-col gap-3">
        <h3 className="text-lg font-semibold">Run history</h3>
        <RuleRunHistory ruleId={params.id} />
      </div>
    </div>
  )
}
