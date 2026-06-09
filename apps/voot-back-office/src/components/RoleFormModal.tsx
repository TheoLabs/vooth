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

/** 모달 동작 모드. create=등록, edit=수정. */
export type RoleFormMode = 'create' | 'edit';

interface RoleFormModalProps {
  open: boolean;
  /** 동작 모드(기본 create). edit 시 제목/버튼/안내 문구가 달라진다. */
  mode?: RoleFormMode;
  /** edit 모드에서 폼을 채울 초기값. open 될 때 폼에 반영된다. */
  initialValues?: RoleFormValues;
  /** 제출 중 여부 — 버튼 로딩/중복 제출 방지 */
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: RoleFormValues) => void;
}

/** 모드별 모달 텍스트(제목/확인 버튼). */
const MODE_TEXT: Record<RoleFormMode, { title: string; okText: string }> = {
  create: { title: '역할 등록', okText: '등록' },
  edit: { title: '역할 수정', okText: '수정' },
};

/**
 * 역할 등록/수정 모달.
 * 유형(RoleType)/이름과 부여할 권한을 입력받아 onSubmit 으로 넘긴다.
 * mode='edit' 일 때 initialValues 로 폼을 미리 채운다. 수정 API 는 권한만
 * 변경하므로 유형/이름은 참고용으로 보여주되 비활성화한다.
 * 실제 호출은 상위에서 처리한다.
 */
export function RoleFormModal({
  open,
  mode = 'create',
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}: RoleFormModalProps) {
  const [form] = Form.useForm<RoleFormValues>();

  // 모달이 닫힐 때 입력값을 초기화하고, 열릴 때 모드에 맞게 채운다.
  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    if (mode === 'edit' && initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [open, mode, initialValues, form]);

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

  const { title, okText } = MODE_TEXT[mode];
  // 수정 모드에서는 권한만 변경 가능하므로 유형/이름을 비활성화한다.
  const isEdit = mode === 'edit';

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={okText}
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
          extra={isEdit ? '유형은 수정 시 변경할 수 없습니다.' : undefined}
        >
          <Select
            placeholder="유형 선택"
            options={ROLE_TYPE_OPTIONS}
            disabled={isEdit}
          />
        </Form.Item>

        <Form.Item
          label="이름"
          name="name"
          rules={[{ required: true, message: '이름을 입력하세요.' }]}
          extra={isEdit ? '이름은 수정 시 변경할 수 없습니다.' : undefined}
        >
          <Input placeholder="정산 관리자" autoComplete="off" disabled={isEdit} />
        </Form.Item>

        <Form.Item label="권한" name="permissions">
          <PermissionTreeSelect />
        </Form.Item>
      </Form>
    </Modal>
  );
}
