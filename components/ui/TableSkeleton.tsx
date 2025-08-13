import {
  TableRow,
  TableCell,
  Skeleton,
  Box,
} from '@mui/material'

interface TableSkeletonRowProps {
  columns: number
  actionColumn?: boolean
}

export function TableSkeletonRow({ columns, actionColumn = true }: TableSkeletonRowProps) {
  const totalColumns = actionColumn ? columns : columns - 1

  return (
    <TableRow>
      {Array.from({ length: totalColumns }).map((_, index) => (
        <TableCell key={index}>
          {index === 0 ? (
            // First column usually has main content (name/title)
            <Box>
              <Skeleton 
                variant="text" 
                width="70%" 
                height={20} 
                sx={{ mb: 0.5, fontSize: '0.875rem' }}
              />
              <Skeleton 
                variant="text" 
                width="50%" 
                height={16} 
                sx={{ fontSize: '0.75rem' }}
              />
            </Box>
          ) : index === totalColumns - 1 && actionColumn ? (
            // Last column for actions
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          ) : (
            // Regular columns
            <Skeleton variant="text" width="60%" height={20} />
          )}
        </TableCell>
      ))}
    </TableRow>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns: number
  actionColumn?: boolean
}

export function TableSkeleton({ 
  rows = 8, 
  columns, 
  actionColumn = true 
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <TableSkeletonRow 
          key={index} 
          columns={columns} 
          actionColumn={actionColumn}
        />
      ))}
    </>
  )
}