import { ProfessorStudio } from '@/app/admin/studio/ProfessorStudio';

export const metadata = {
  title: 'Professor Studio | Pumping Llama',
  description: 'Create and export interactive theory of computation problem files.',
};

export default function StudioPage() {
  return <ProfessorStudio />;
}