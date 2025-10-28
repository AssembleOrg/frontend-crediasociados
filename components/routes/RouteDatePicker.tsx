'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Button,
  Popover,
  Stack,
  Chip,
} from '@mui/material';
import {
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  Today,
} from '@mui/icons-material';
import { DateTime } from 'luxon';

interface RouteDatePickerProps {
  selectedDate: string | null; // ISO date string or null for today
  onDateSelect: (date: string) => void;
  onTodaySelect: () => void;
}

/**
 * RouteDatePicker - Compact calendar for selecting route dates
 * Mobile-first design with inline week view
 */
export function RouteDatePicker({
  selectedDate,
  onDateSelect,
  onTodaySelect,
}: RouteDatePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() =>
    DateTime.now().startOf('month')
  );

  const today = DateTime.now().startOf('day');
  const selected = selectedDate
    ? DateTime.fromISO(selectedDate).startOf('day')
    : today;

  const isToday = !selectedDate || selected.equals(today);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateClick = (date: DateTime) => {
    onDateSelect(date.toISODate() || '');
    handleClose();
  };

  const handleTodayClick = () => {
    onTodaySelect();
    handleClose();
  };

  const previousMonth = () => {
    setCurrentMonth((prev) => prev.minus({ months: 1 }));
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => prev.plus({ months: 1 }));
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.startOf('week'); // Start from Monday
    const endDay = endOfMonth.endOf('week');

    const days: DateTime[] = [];
    let current = startDay;

    while (current <= endDay) {
      days.push(current);
      current = current.plus({ days: 1 });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const open = Boolean(anchorEl);

  return (
    <Box>
      {/* Trigger Button */}
      <Button
        onClick={handleOpen}
        startIcon={<CalendarToday />}
        variant={isToday ? 'outlined' : 'contained'}
        color={isToday ? 'primary' : 'success'}
        sx={{
          minWidth: { xs: 'auto', sm: 180 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          {isToday ? 'Hoy' : selected.toFormat('dd/MM/yyyy')}
        </Box>
        <Box sx={{ display: { xs: 'block', sm: 'none' }, ml: 0.5 }}>
          {isToday ? 'Hoy' : selected.toFormat('dd/MM')}
        </Box>
      </Button>

      {/* Calendar Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPopover-paper': {
            mt: 1,
            minWidth: { xs: 280, sm: 320 },
            maxWidth: { xs: '90vw', sm: 400 },
          },
        }}
      >
        <Paper elevation={3} sx={{ p: 2 }}>
          {/* Month Navigation */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <IconButton onClick={previousMonth} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography variant="subtitle1" fontWeight="bold">
              {currentMonth.toFormat('MMMM yyyy')}
            </Typography>
            <IconButton onClick={nextMonth} size="small">
              <ChevronRight />
            </IconButton>
          </Stack>

          {/* Today Button */}
          <Button
            onClick={handleTodayClick}
            startIcon={<Today />}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          >
            Ir a Hoy
          </Button>

          {/* Weekday Headers */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
              mb: 1,
            }}
          >
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
              <Typography
                key={index}
                variant="caption"
                align="center"
                fontWeight="bold"
                color="text.secondary"
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Calendar Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
            }}
          >
            {calendarDays.map((day, index) => {
              const isSelected = day.equals(selected);
              const isCurrentMonth = day.month === currentMonth.month;
              const isTodayDate = day.equals(today);
              const isFuture = day > today;

              return (
                <Button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  disabled={isFuture}
                  sx={{
                    minWidth: 0,
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                    p: 0,
                    fontSize: '0.875rem',
                    borderRadius: 1,
                    color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                    bgcolor: isSelected
                      ? 'success.main'
                      : isTodayDate
                      ? 'primary.light'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: isSelected
                        ? 'success.dark'
                        : isTodayDate
                        ? 'primary.main'
                        : 'action.hover',
                    },
                    ...(isSelected && {
                      color: 'white',
                      fontWeight: 'bold',
                    }),
                    ...(isTodayDate &&
                      !isSelected && {
                        border: '2px solid',
                        borderColor: 'primary.main',
                      }),
                  }}
                >
                  {day.day}
                </Button>
              );
            })}
          </Box>

          {/* Selected Date Info */}
          {!isToday && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Fecha seleccionada:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {selected.toFormat("EEEE, dd 'de' MMMM 'de' yyyy")}
              </Typography>
            </Box>
          )}
        </Paper>
      </Popover>
    </Box>
  );
}

