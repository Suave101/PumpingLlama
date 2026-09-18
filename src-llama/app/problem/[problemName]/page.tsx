import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Problem } from '@/types/automata';
import ProblemWorkspace from '@/app/problem/[problemName]/ProblemWorkspace';

export async function generateStaticParams() {
  const problemsDir = path.join(process.cwd(), 'public/problems');
  if (!fs.existsSync(problemsDir)) return [];

  const files = fs.readdirSync(problemsDir).filter((f) => f.endsWith('.json'));
  return files.map((file) => ({
    problemName: file.replace(/\.json$/, ''),
  }));
}

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ problemName: string }>;
}) {
  const { problemName } = await params;
  const filePath = path.join(process.cwd(), 'public/problems', `${problemName}.json`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const problem: Problem = JSON.parse(fileContent);

  return <ProblemWorkspace problem={problem} />;
}