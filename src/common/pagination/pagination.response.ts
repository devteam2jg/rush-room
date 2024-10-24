import { PaginationResponseBuilder } from '~/src/common/pagination/pagination.response.builder';

export class PaginationResponse<T> {
  data: T[];
  page: number;
  take: number;
  totalCount: number;
  totalPage: number;
  hasNextPage: boolean;

  constructor(paginationBuilder: PaginationResponseBuilder<T>) {
    this.data = paginationBuilder._data;
    this.page = paginationBuilder._page;
    this.take = paginationBuilder._take;
    this.totalCount = paginationBuilder._totalCount;
    this.totalPage = this.getTotalPage(
      paginationBuilder._totalCount,
      paginationBuilder._take,
    );
    this.hasNextPage = this.getHasNextPage(
      paginationBuilder._page,
      this.getTotalPage(paginationBuilder._totalCount, paginationBuilder._take),
    );
  }

  private getTotalPage(totalCount: number, take: number): number {
    return Math.ceil(totalCount / take);
  }

  private getHasNextPage(page: number, totalPage: number): boolean {
    return page < totalPage;
  }
}
