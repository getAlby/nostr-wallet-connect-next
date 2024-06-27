import useSWR, { SWRConfiguration } from "swr";

import { Transaction } from "src/types";
import { swrFetcher } from "src/utils/swr";

const pollConfiguration: SWRConfiguration = {
  refreshInterval: 3000,
};

export function useInvoice(invoice: string, poll = false) {
  return useSWR<Transaction>(
    invoice && `/api/invoice/${invoice}`,
    swrFetcher,
    poll ? pollConfiguration : undefined
  );
}
