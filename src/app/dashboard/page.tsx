import { getCurrentUser } from "@/lib/auth/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">
        你好，{user?.name || "同学"}！
      </h1>

      <div className="grid gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">今日学习</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground">今日已学单词</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/learn"
          className={buttonVariants({ size: "lg" })}
        >
          开始学习
        </Link>
        <Link
          href="/review"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          开始复习
        </Link>
      </div>
    </div>
  )
}
