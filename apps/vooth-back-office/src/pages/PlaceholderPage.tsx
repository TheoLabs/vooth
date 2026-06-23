import { Typography } from 'antd';

interface PlaceholderPageProps {
  /** 화면(메뉴) 이름 */
  title: string;
  /** 부가 설명. 생략 시 기본 준비중 문구 사용 */
  desc?: string;
}

/**
 * 메뉴 IA 스켈레톤용 공용 placeholder.
 * 실제 기능/데이터는 아직 없고 "메뉴명 + mock 준비 중" 안내만 보여준다.
 */
export function PlaceholderPage({ title, desc }: PlaceholderPageProps) {
  return (
    <div className="bo-page" style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
        {desc ?? 'mock 준비 중입니다.'}
      </Typography.Paragraph>
    </div>
  );
}
