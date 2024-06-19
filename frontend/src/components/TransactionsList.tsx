import dayjs from "dayjs";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import Loading from "src/components/Loading";
import { useTransactions } from "src/hooks/useTransactions";

function TransactionsList() {
  const { data: transactions } = useTransactions();

  if (!transactions) {
    return <Loading />;
  }

  console.info(transactions);

  return (
    <div>
      {!transactions?.length ? (
        <p className="text-center py-16 text-gray-500 dark:text-neutral-400">
          No transactions, yet.
          {/* Deposit Bitcoin Button */}
        </p>
      ) : (
        <>
          {transactions?.map((tx, i) => {
            const type = tx.type;

            return (
              <div
                key={`tx-${i}`}
                className="p-3 mb-4 hover:bg-gray-100 dark:hover:bg-surface-02dp cursor-pointer rounded-md"
                // onClick={() => openDetails(tx)}
              >
                <div className="flex gap-3">
                  <div className="flex items-center">
                    {type == "outgoing" ? (
                      <div className="flex justify-center items-center bg-orange-100 dark:bg-orange-950 rounded-full w-14 h-14">
                        <ArrowUpIcon
                          strokeWidth={3}
                          className="w-8 h-8 text-orange-400 dark:text-amber-600 stroke-orange-400 dark:stroke-amber-600"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center items-center bg-green-100 dark:bg-emerald-950 rounded-full w-14 h-14">
                        <ArrowDownIcon
                          strokeWidth={3}
                          className="w-8 h-8 text-green-500 dark:text-emerald-500 stroke-green-400 dark:stroke-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden mr-3">
                    <div className="text-xl font-semibold text-black truncate dark:text-white">
                      <p className="truncate">
                        {type == "incoming" ? "Received" : "Sent"}
                      </p>
                    </div>
                    <p className="text-muted-foreground">
                      {dayjs(tx.settled_at * 1000).fromNow()}
                      {tx.description}
                    </p>
                  </div>
                  <div className="flex ml-auto text-right space-x-3 shrink-0 dark:text-white">
                    <div className="flex items-center gap-2 text-xl">
                      <p
                        className={`font-semibold ${
                          type == "incoming" &&
                          "text-green-600 dark:color-green-400"
                        }`}
                      >
                        {type == "outgoing" ? "-" : "+"}{" "}
                        {Math.floor(tx.amount / 1000)}
                      </p>
                      <p className="text-muted-foreground">sats</p>

                      {/* {!!tx.totalAmountFiat && (
                        <p className="text-xs text-gray-400 dark:text-neutral-600">
                          ~{tx.totalAmountFiat}
                        </p>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* {transaction && (
            <TransactionModal
              transaction={transaction}
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false);
              }}
            />
          )} */}
        </>
      )}
    </div>
  );
}

export default TransactionsList;
