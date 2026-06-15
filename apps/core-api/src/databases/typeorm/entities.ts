import { DddEvent } from '@libs/ddd';
import { Account } from '@modules/account/domain/account.entity';
import { Casting } from '@modules/casting/domain/casting.entity';
import { Character } from '@modules/character/domain/character.entity';
import { Content } from '@modules/content/domain/content.entity';
import { Creator } from '@modules/creator/domain/creator.entity';
import { Cut } from '@modules/episode/domain/cut.entity';
import { Episode } from '@modules/episode/domain/episode.entity';
import { Line } from '@modules/episode/domain/line.entity';
import { File } from '@modules/file/domain/file.entity';
import { Permission } from '@modules/permission/domain/permission.entity';
import { Recording } from '@modules/recording/domain/recording.entity';
import { LineTake } from '@modules/line-take/domain/line-take.entity';
import { Role } from '@modules/role/domain/role.entity';
import { Tag } from '@modules/tag/domain/tag.entity';
import { Review } from '@modules/review/domain/review.entity';

export default [
  DddEvent,
  Account,
  Role,
  Permission,
  Content,
  Tag,
  File,
  Character,
  Creator,
  Casting,
  Episode,
  Cut,
  Line,
  Recording,
  LineTake,
  Review,
];
