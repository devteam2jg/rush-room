import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginationDefaultEnum } from '~/src/common/pagination/pagination.default.enum';
import { PaginationRequest } from '~/src/common/pagination/pagination.request';

export const GetPagination = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const page = request.query.page || PaginationDefaultEnum.PAGE_DEFAULT;
    const take = request.query.take || PaginationDefaultEnum.TAKE_DEFAULT;

    return new PaginationRequest(page, take);
  },
);
