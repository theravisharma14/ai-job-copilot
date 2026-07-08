'use client';

import { DashboardStats } from '@/components/dashboard-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s your job search overview.</p>
      </div>

      <DashboardStats />

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
              <CardDescription>Your application activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Chart placeholder - Integrate Recharts
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="col-span-3"
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest jobs you&apos;ve applied to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">Software Engineer</p>
                      <p className="text-sm text-muted-foreground">Company {i}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">2d ago</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>AI Suggestions</CardTitle>
            <CardDescription>Personalized recommendations to improve your job search</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">1</span>
                <p>Tailor your resume for <strong>Senior Developer</strong> roles to improve ATS score by 25%</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs">2</span>
                <p>Apply to 5 more jobs this week to reach your goal</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs">3</span>
                <p>Complete a mock interview to prepare for upcoming interviews</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
