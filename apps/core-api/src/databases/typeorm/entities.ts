import { DddEvent } from '@libs/ddd';
import { Account } from '@modules/account/domain/account.entity';
import { Permission } from '@modules/permission/domain/permission.entity';
import { Role } from '@modules/role/domain/role.entity';
import { File } from '@modules/file/domain/file.entity';
import { Creator } from '@modules/creator/domain/creator.entity';
import { Tag } from '@modules/tag/domain/tag.entity';
import { Content } from '@modules/content/domain/content.entity';
import { Character } from '@modules/character/domain/character.entity';

export default [DddEvent, Account, Role, Permission, File, Creator, Content, Tag, Character];
