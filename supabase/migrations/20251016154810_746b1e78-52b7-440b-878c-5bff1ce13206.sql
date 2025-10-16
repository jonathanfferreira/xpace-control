-- Add payment_provider column to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'MOCK' CHECK (payment_provider IN ('MOCK', 'ASAAS_SANDBOX'));

-- Add payment_reference column to payments table to store external payment IDs
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_reference text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);