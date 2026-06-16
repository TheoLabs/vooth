import { DddAggregate } from '@libs/ddd';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

interface Ctor {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

/**
 * 업로드 파일 메타.
 * - 바이너리는 S3 에만 있고, 여기엔 객체 키/메타만 둔다(`getPublicUrl(key)` 로 표시 URL 유도).
 * - **commit-on-attach**: 업로드 직후가 아니라, 소유 도메인이 이 파일을 참조하며 저장하는
 *   트랜잭션 안에서 `isCommit=true`(단방향). 미커밋(=미채택)은 cron 으로 수거한다.
 */
@Entity()
@Index('idx_file_is_commit_created_at', ['isCommit', 'createdAt'])
export class File extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({
    type: 'bigint',
    // bigint 는 TypeORM 에서 문자열로 오므로 number 로 환원한다.
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value == null ? value : Number(value)),
    },
  })
  size: number;

  @Column({ default: false })
  isCommit: boolean;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.key = args.key;
      this.originalName = args.originalName;
      this.mimeType = args.mimeType;
      this.size = args.size;
      this.isCommit = false;
    }
  }

  static of(args: Ctor): File {
    return new File(args);
  }

  /** 채택 확정. 멱등(이미 커밋이면 무시). 되돌리지 않는다(false→true 단방향). */
  commit() {
    if (this.isCommit) {
      return;
    }

    this.isCommit = true;
  }
}
