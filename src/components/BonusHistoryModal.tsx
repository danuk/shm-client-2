import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Center, Loader, Paper, Pagination, LoadingOverlay, ScrollArea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { userApi } from '../api/client';
import DataTable, { Column } from './DataTable';

interface BonusTransaction {
  withdraw_id: number;
  withdraw_date: string;
  cost: number;
  total: number;
  bonus: number;
}

interface BonusHistoryModalProps {
  opened: boolean;
  onClose: () => void;
}

const PER_PAGE = 10;

export default function BonusHistoryModal({ opened, onClose }: BonusHistoryModalProps) {
  const [transactions, setTransactions] = useState<BonusTransaction[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { t, i18n } = useTranslation();

  const fetchTransactions = async (
    p: number,
    isInitial = false,
    field?: string,
    direction?: 'asc' | 'desc',
  ) => {
    if (isInitial) setInitialLoading(true);
    else setTableLoading(true);

    try {
      const offset = (p - 1) * PER_PAGE;
      const response = await userApi.getWithdrawals({
        limit: PER_PAGE,
        offset,
        ...(field ? { sort_field: field, sort_direction: direction || sortDirection } : {}),
        filter: { bonus: { '!=': 0 } },
      });

      setTransactions(response.data.data || []);
      if (typeof response.data.items === 'number') {
        setTotalItems(response.data.items);
      }
    } catch {
      // silent
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (!opened) return;
    setPage(1);
    setSortField('');
    setSortDirection('asc');
    fetchTransactions(1, true);
  }, [opened]);

  useEffect(() => {
    if (!opened || initialLoading) return;
    fetchTransactions(page, false, sortField, sortDirection);
  }, [page, sortField, sortDirection]);

  const totalPages = Math.ceil(totalItems / PER_PAGE);

  const columns: Column<BonusTransaction>[] = [
    {
      title: t('bonuses.date'),
      accessor: (tx) => tx.withdraw_date
        ? new Date(tx.withdraw_date).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')
        : '-',
      sortable: true,
      sortKey: 'withdraw_date',
    },
    {
      title: t('services.cost'),
      accessor: (tx) => <Text size="sm">{tx.cost} ₽</Text>,
      sortable: true,
      sortKey: 'cost',
    },
    {
      title: t('withdrawals.total'),
      accessor: (tx) => <Text size="sm">{tx.total} ₽</Text>,
      sortable: true,
      sortKey: 'total',
    },
    {
      title: t('bonuses.amount'),
      accessor: (tx) => (
        <Text size="sm" fw={500} c={tx.bonus > 0 ? 'green' : 'red'}>
          {tx.bonus > 0 ? '+' : ''}
          {tx.bonus}
        </Text>
      ),
      sortable: true,
      sortKey: 'bonus',
    },
  ];

  return (
    <Modal opened={opened} onClose={onClose} title={t('bonuses.historyTitle')} size="lg">
      {initialLoading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : transactions.length === 0 ? (
        <Paper p="xl" radius="md">
          <Center>
            <Text c="dimmed">{t('bonuses.historyEmpty')}</Text>
          </Center>
        </Paper>
      ) : (
        <Stack gap="md">
          <Paper withBorder radius="md" style={{ overflow: 'hidden', position: 'relative' }}>
            <LoadingOverlay visible={tableLoading} overlayProps={{ blur: 1 }} />
            <ScrollArea>
              <DataTable
                data={transactions}
                columns={columns}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={(field, dir) => {
                  setSortField(field);
                  setSortDirection(dir);
                  setPage(1);
                }}
              />
            </ScrollArea>
          </Paper>

          {totalPages > 1 && (
            <Center>
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Center>
          )}
        </Stack>
      )}
    </Modal>
  );
}
