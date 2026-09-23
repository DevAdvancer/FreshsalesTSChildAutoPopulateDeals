const { getDeal, getDealFieldChoices, getTradeshowById, updateDeal } = require('./freshsales');
const { saveLog } = require('./logger');

const FIELDS_TO_COPY = [
  'cf_cal_dismantle_date',
  'cf_cal_dismantle_start_time',
  'cf_day_1_end_block_1',
  'cf_day_1_end_block_2',
  'cf_day_1_exhibit_date',
  'cf_day_1_start_block_1',
  'cf_day_1_start_block_2',
  'cf_day_1_start_block_3',
  'cf_day_1_end_block_3',
  'cf_day_2_end_block_1',
  'cf_day_2_end_block_2',
  'cf_day_2_end_block_3',
  'cf_day_2_exhibit_date',
  'cf_day_2_start_block_1',
  'cf_day_2_start_block_2',
  'cf_day_2_start_block_3',
  'cf_day_3_end_block_1',
  'cf_day_3_end_block_2',
  'cf_day_3_end_block_3',
  'cf_day_3_exhibit_date',
  'cf_day_3_start_block_1',
  'cf_day_3_start_block_2',
  'cf_day_3_start_block_3',
  'cf_day_4_end_block_1',
  'cf_day_4_end_block_2',
  'cf_day_4_end_block_3',
  'cf_day_4_exhibit_date',
  'cf_day_4_start_block_1',
  'cf_day_4_start_block_2',
  'cf_day_4_start_block_3',
  'cf_day_5_end_block_1',
  'cf_day_5_end_block_3',
  'cf_day_5_exhibit_date',
  'cf_day_5_start_block_1',
  'cf_day_5_start_block_2',
  'cf_day_5_start_end_block_2',
  'cf_day_5_start_block_3',
  'cf_day_6_exhibit_date',
  'cf_day_6_start_block_1',
  'cf_day_6_start_block_2',
  'cf_day_6_start_block_3',
  'cf_day_6_end_block_1',
  'cf_day_6_end_block_2',
  'cf_day_6_end_block_3',
  'cf_install_end_time',
  'cf_install_start_time',
  'cf_show_close_time',
  'cf_show_open_time',
  'cf_total_service_days',
  'cf_total_service_hours'
];

const DEAL_TRADESHOW_CHILD_FIELD = 'cf_tradeshow_year'; 
const DISMANTLE_TIME_FIELD = 'cf_cal_dismantle_start_time';

const normalizeDismantleTime = (value) => {
  if (typeof value !== 'string') return value;
  const match = value.trim().match(/^(1[0-2]|[1-9]):([0-5]\d)\s*(AM|PM)$/i);
  if (!match) return value;
  const hour = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
};

export const processDealSync = async (dealId) => {
  if (!dealId) {
    await saveLog({ status: 'ERROR', message: 'Deal ID is required but missing.' });
    throw { status: 400, message: 'Deal ID is required.' };
  }

  await saveLog({ dealId, status: 'INFO', message: 'Starting deal sync process.' });

  // Step 2: Fetch the Deal
  const dealResponse = await getDeal(dealId);
  const deal = dealResponse.deal;
  
  if (!deal) {
    await saveLog({ dealId, status: 'ERROR', message: 'Deal not found in Freshsales.' });
    throw { status: 404, message: 'Deal not found in Freshsales.' };
  }

  // Step 3: Extract the Tradeshow Child Name
  const tradeshowChildId = deal.custom_field && deal.custom_field[DEAL_TRADESHOW_CHILD_FIELD];
  
  if (!tradeshowChildId) {
    await saveLog({ dealId, status: 'WARN', message: 'Deal fetched successfully, but Tradeshow Child field is empty.' });
    return {
      success: true,
      message: 'Deal fetched successfully, but Tradeshow Child field is empty.',
      dealId,
      tradeshowFound: false,
      fieldsCopied: 0
    };
  }

  // Step 4: Fetch Tradeshow module record by ID
  await saveLog({ dealId, status: 'INFO', message: `Fetching tradeshow record ID: ${tradeshowChildId}` });
  const tradeshow = await getTradeshowById(tradeshowChildId);
  
  if (!tradeshow) {
    await saveLog({ dealId, status: 'ERROR', message: `Tradeshow record not found for ID: ${tradeshowChildId}` });
    throw { status: 404, message: `Tradeshow record not found for ID: ${tradeshowChildId}` };
  }

  // Step 6: Copy fields
  const updatePayload = { custom_field: {} };
  let fieldsCopied = 0;
  const skippedFields = [];
  const sourceDismantleTime = tradeshow.custom_field?.[DISMANTLE_TIME_FIELD];
  const dealDismantleChoices = sourceDismantleTime == null
    ? null
    : await getDealFieldChoices(DISMANTLE_TIME_FIELD);

  for (const field of FIELDS_TO_COPY) {
    const sourceValue = tradeshow.custom_field ? tradeshow.custom_field[field] : tradeshow[field];
    const fieldValue = field === DISMANTLE_TIME_FIELD ? normalizeDismantleTime(sourceValue) : sourceValue;
    if (field === DISMANTLE_TIME_FIELD && fieldValue != null && !dealDismantleChoices.has(String(fieldValue))) {
      skippedFields.push(field);
      continue;
    }
    const currentValue = deal.custom_field?.[field];
    const sameDate = field.endsWith('_date') && typeof fieldValue === 'string' &&
      typeof currentValue === 'string' && fieldValue.slice(0, 10) === currentValue.slice(0, 10);
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== currentValue && !sameDate) {
      updatePayload.custom_field[field] = fieldValue;
      fieldsCopied++;
    }
  }

  if (skippedFields.length) {
    await saveLog({ dealId, status: 'WARN', message: `Skipped fields with values unavailable on the deal: ${skippedFields.join(', ')}.` });
  }

  if (fieldsCopied === 0) {
    await saveLog({ dealId, status: skippedFields.length ? 'WARN' : 'SUCCESS', message: skippedFields.length ? 'No fields updated; source values are unavailable on the deal.' : 'No field changes needed.' });
    return {
      success: true,
      message: skippedFields.length ? 'No fields updated; source values are unavailable on the deal.' : 'No field changes needed.',
      dealId,
      tradeshowFound: true,
      fieldsCopied: 0,
      skippedFields
    };
  }

  // Update the deal
  await saveLog({ dealId, status: 'INFO', message: `Updating deal with ${fieldsCopied} fields.` });
  await updateDeal(dealId, updatePayload);

  await saveLog({ dealId, status: 'SUCCESS', message: 'Deal updated successfully.', payload: updatePayload });

  return {
    success: true,
    message: 'Deal updated successfully.',
    dealId,
    tradeshowFound: true,
    fieldsCopied,
    skippedFields,
    updatedPayload: updatePayload
  };
};
