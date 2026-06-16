import { DddEvent } from '@libs/ddd';
import { Account } from '@modules/account/domain/account.entity';
import { Permission } from '@modules/permission/domain/permission.entity';
import { Role } from '@modules/role/domain/role.entity';
import { File } from '@modules/file/domain/file.entity';

export default [DddEvent, Account, Role, Permission, File];
