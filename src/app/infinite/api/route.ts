import { NextRequest } from "next/server";
import { mock } from "./mock";
import { searchParamsCache } from "../search-params";
import { filterData, percentileData, sortData } from "./helpers";

export async function GET(req: NextRequest) {
  const _search: Map<string, string> = new Map();

  // TODO: we could use a POST request to avoid this
  req.nextUrl.searchParams.forEach((value, key) => _search.set(key, value));
  const search = searchParamsCache.parse(Object.fromEntries(_search));

  // Simulate a database query
  await new Promise((resolve) => setTimeout(resolve, 500));

  const totalData = mock;
  const filteredData = filterData(totalData, search);
  const sortedData = sortData(filteredData, search.sort);
  const withPercentileData = percentileData(sortedData);

  // FIXME: this is fugly
  const totalFilters = totalData.reduce((prev, curr) => {
    for (const key in curr) {
      const value = curr[key as keyof typeof curr];
      const prevValue = prev[key as keyof typeof prev] || [];
      if (Array.isArray(value)) {
        prev[key as keyof typeof prev] = [
          // @ts-ignore
          ...new Set([...prevValue, ...value]),
        ];
      } else {
        // @ts-ignore
        prev[key as keyof typeof prev] = [...new Set([...prevValue, value])];
      }
    }
    return prev;
  }, {} as Record<string, (number | string | boolean | Date)[]>);

  return Response.json({
    data: withPercentileData.slice(search.start, search.start + search.size),
    meta: {
      totalRowCount: totalData.length,
      filterRowCount: filteredData.length,
      totalFilters,
    },
  });
}
