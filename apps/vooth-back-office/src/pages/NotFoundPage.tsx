import { Button, Result } from 'antd';

/** API 404 또는 알 수 없는 경로 진입 시 보여주는 페이지. */
export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="요청하신 페이지를 찾을 수 없습니다."
        extra={
          <Button type="primary" onClick={() => window.location.assign('/')}>
            홈으로
          </Button>
        }
      />
    </div>
  );
}
