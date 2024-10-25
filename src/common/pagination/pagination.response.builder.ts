import { PaginationResponse } from '~/src/common/pagination/pagination.response';

export class PaginationResponseBuilder<T> {
  _data: T[];
  _page: number;
  _take: number;
  _totalCount: number;

  setData(data: T[]) {
    this._data = data;
    return this;
  }

  setPage(page: number) {
    this._page = page;
    return this;
  }

  setTake(take: number) {
    this._take = take;
    return this;
  }

  setTotalCount(totalCount: number) {
    this._totalCount = totalCount;
    return this;
  }

  build(): PaginationResponse<T> {
    return new PaginationResponse(this);
  }
}
