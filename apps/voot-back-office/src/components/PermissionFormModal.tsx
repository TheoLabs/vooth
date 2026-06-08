import { useEffect, useMemo } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { PermissionCategory } from '@vooth/shared';
import { PERMISSION_CATEGORY_OPTIONS } from '../mocks/permissions.mock';

export interface PermissionFormValues {
  code: string;
  name: string;
  category: PermissionCategory;
  description: string;
}

interface PermissionFormModalProps {
  open: boolean;
  /** 이미 사용 중인 코드 목록 (중복 검사용) */
  existingCodes: string[];
  /** 제출 중 여부 — 버튼 로딩/중복 제출 방지 */
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: PermissionFormValues) => void;
}

// 코드 컨벤션: 소문자 리소스:액션 (예: account:read)
const CODE_PATTERN = /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/;

/**
 * 권한 등록 모달.
 * 코드/이름/카테고리/설명을 입력받아 onSubmit 으로 넘긴다.
 * 데이터는 아직 목 기반이므로 검증만 수행하고 실제 호출은 상위에서 처리한다.
 */
export function PermissionFormModal({
  open,
  existingCodes,
  submitting,
  onCancel,
  onSubmit,
}: PermissionFormModalProps) {
  const [form] = Form.useForm<PermissionFormValues>();

  // 모달이 닫힐 때 입력값을 초기화한다.
  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const normalizedCodes = useMemo(
    () => existingCodes.map((code) => code.toLowerCase()),
    [existingCodes],
  );

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onSubmit({
          ...values,
          code: values.code.trim().toLowerCase(),
          name: values.name.trim(),
          description: values.description?.trim() ?? '',
        });
      })
      .catch(() => {
        // 검증 실패 — 폼이 에러 메시지를 표시하므로 별도 처리 없음
      });
  };

  return (
    <Modal
      title="권한 등록"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="등록"
      cancelText="취소"
      confirmLoading={submitting}
      destroyOnHidden
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
      >
        <Form.Item
          label="코드"
          name="code"
          tooltip="소문자 리소스:액션 (예: content:publish)"
          rules={[
            { required: true, message: '코드를 입력하세요.' },
            {
              pattern: CODE_PATTERN,
              message: '소문자 형식의 `리소스:액션` 으로 입력하세요. (예: content:publish)',
            },
            {
              validator: (_, value) =>
                value && normalizedCodes.includes(value.trim().toLowerCase())
                  ? Promise.reject(new Error('이미 사용 중인 코드입니다.'))
                  : Promise.resolve(),
            },
          ]}
        >
          <Input placeholder="content:publish" autoComplete="off" />
        </Form.Item>

        <Form.Item
          label="이름"
          name="name"
          rules={[{ required: true, message: '이름을 입력하세요.' }]}
        >
          <Input placeholder="콘텐츠 게시" autoComplete="off" />
        </Form.Item>

        <Form.Item
          label="카테고리"
          name="category"
          rules={[{ required: true, message: '카테고리를 선택하세요.' }]}
        >
          <Select placeholder="카테고리 선택" options={PERMISSION_CATEGORY_OPTIONS} />
        </Form.Item>

        <Form.Item label="설명" name="description">
          <Input.TextArea
            placeholder="이 권한이 무엇을 허용하는지 적어주세요."
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
