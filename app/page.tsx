import dynamic from 'next/dynamic';

const RMKCrm = dynamic(() => import('../components/RmkCrmUI'), { ssr: false });

export default function Home() {
  return <RMKCrm />;
}
