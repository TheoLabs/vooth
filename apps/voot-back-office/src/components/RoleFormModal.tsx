import { useEffect } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { RoleType } from '@vooth/shared';
import { ROLE_TYPE_OPTIONS } from '../mocks/roles.mock';
import { PermissionTreeSelect } from './PermissionTreeSelect';

export interface RoleFormValues {
  type: RoleType;
  name: string;
  permissions: string[];
}

interface RoleFormModalProps {
  open: boolean;
  /** 제출 중 여부 — 버튼 로딩/중복 제출 방지 */
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: RoleFormValues) => void;
}

/**
 * 역할 등록 모달.
 * 유형(RoleType)/이름과 부여할 권한을 입력받아 onSubmit 으로 넘긴다.
 * 데이터는 아직 목 기반이므로 검증만 수행하고 실제 호출은 상위에서 처리한다.
 */
export function RoleFormModal({
  open,
  submitting,
  onCancel,
  onSubmit,
}: RoleFormModalProps) {
  const [form] = Form.useForm<RoleFormValues>();

  // 모달이 닫힐 때 입력값을 초기화한다.
  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onSubmit({
          ...values,
          name: values.name.trim(),
          permissions: values.permissions ?? [],
        });
      })
      .catch(() => {
        // 검증 실패 — 폼이 에러 메시지를 표시하므로 별도 처리 없음
      });
  };

  return (
    <Modal
      title="역할 등록"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="등록"
      cancelText="취소"
      confirmLoading={submitting}
      destroyOnHidden
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{ permissions: [] }}
      >
        <Form.Item
          label="유형"
          name="type"
          rules={[{ required: true, message: '유형을 선택하세요.' }]}
        >
          <Select placeholder="유형 선택" options={ROLE_TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="이름"
          name="name"
          rules={[{ required: true, message: '이름을 입력하세요.' }]}
        >
          <Input placeholder="정산 관리자" autoComplete="off" />
        </Form.Item>

        <Form.Item label="권한" name="permissions">
          <PermissionTreeSelect />
        </Form.Item>
      </Form>
    </Modal>
  );
}
