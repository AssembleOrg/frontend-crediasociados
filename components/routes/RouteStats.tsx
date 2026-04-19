'use client';

import { Box, Paper, List, ListItem, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, LocalAtm } from '@mui/icons-material';
import React from 'react';

interface RouteStatsProps {
  totalCollected: number;
  totalExpenses: number;
  totalLoaned?: number;
  netAmount: number;
  currency?: string;
}

const fmtCompact = (amount: number) => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1).replace('.0', '')}k`;
  return `${sign}$${abs}`;
};

export function RouteStats({
  totalCollected,
  totalExpenses,
  totalLoaned = 0,
  netAmount,
}: RouteStatsProps) {
  const items = [
    {
      icon: <TrendingUp sx={{ fontSize: 20 }} />,
      label: 'Cobrado',
      value: totalCollected,
      color: 'success.main',
    },
    {
      icon: <LocalAtm sx={{ fontSize: 20 }} />,
      label: 'Prestado',
      value: totalLoaned > 0 ? -totalLoaned : 0,
      color: 'error.main',
    },
    {
      icon: <TrendingDown sx={{ fontSize: 20 }} />,
      label: 'Gastos',
      value: totalExpenses,
      color: 'error.main',
    },
    {
      icon: <AccountBalance sx={{ fontSize: 20 }} />,
      label: 'Neto',
      value: netAmount,
      color: netAmount >= 0 ? 'success.main' : 'error.main',
    },
  ];

  return (
    <Paper sx={{ bgcolor: '#FFFFFF', overflow: 'hidden' }}>
      <List disablePadding>
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            <ListItem sx={{ py: 1.25, px: 2 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
              <Typography variant="body1" fontWeight={700} color={item.color}>
                {fmtCompact(item.value)}
              </Typography>
            </ListItem>
            {i < items.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
}
