import { prisma } from '@/lib/db';

export default async function AdminDashboard() {
  const [userCount, classroomCount, invitationCount] = await Promise.all([
    prisma.user.count(),
    prisma.classroom.count(),
    prisma.invitation.count({ where: { status: 'PENDING' } }),
  ]);

  const stats = [
    { label: 'Total Users', value: userCount, color: 'text-blue-600 bg-blue-500/10' },
    { label: 'Classrooms', value: classroomCount, color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Pending Invites', value: invitationCount, color: 'text-amber-600 bg-amber-500/10' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border/50 rounded-xl p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
