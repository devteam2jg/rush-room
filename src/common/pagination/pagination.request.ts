import { IsOptional } from 'class-validator';
import { PaginationDefaultEnum } from '~/src/common/pagination/pagination.default.enum';

export class PaginationRequest {
  @IsOptional()
  private readonly _page?: number = PaginationDefaultEnum.PAGE_DEFAULT;

  @IsOptional()
  private readonly _take?: number = PaginationDefaultEnum.TAKE_DEFAULT;

  constructor(page?: number, take?: number) {
    this._page = page;
    this._take = take;
  }

  skip() {
    return (this._page - 1) * this._take || PaginationDefaultEnum.SKIP_DEFAULT;
  }

  page() {
    return this._page;
  }

  take() {
    return this._take;
  }
}
