import { DddEvent } from '@libs/ddd';
import { Account } from '@modules/account/domain/account.entity';
import { Content } from '@modules/content/domain/content.entity';
import { Permission } from '@modules/permission/domain/permission.entity';
import { Role } from '@modules/role/domain/role.entity';
import { Tag } from '@modules/tag/domain/tag.entity';

export default [DddEvent, Account, Role, Permission, Content, Tag];
