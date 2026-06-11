import { DddEvent } from '@libs/ddd';
import { Account } from '@modules/account/domain/account.entity';
import { Casting } from '@modules/casting/domain/casting.entity';
import { Character } from '@modules/character/domain/character.entity';
import { Content } from '@modules/content/domain/content.entity';
import { Creator } from '@modules/creator/domain/creator.entity';
import { Episode } from '@modules/episode/domain/episode.entity';
import { File } from '@modules/file/domain/file.entity';
import { Permission } from '@modules/permission/domain/permission.entity';
import { Role } from '@modules/role/domain/role.entity';
import { Tag } from '@modules/tag/domain/tag.entity';

export default [DddEvent, Account, Role, Permission, Content, Tag, File, Character, Creator, Casting, Episode];
