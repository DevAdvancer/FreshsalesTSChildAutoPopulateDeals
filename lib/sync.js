const { getDeal, getTradeshowById, updateDeal } = require('./freshsales');
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

  for (const field of FIELDS_TO_COPY) {
    const fieldValue = tradeshow.custom_field ? tradeshow.custom_field[field] : tradeshow[field];
    if (fieldValue !== undefined && fieldValue !== null) {
      updatePayload.custom_field[field] = fieldValue;
      fieldsCopied++;
    }
  }

  if (fieldsCopied === 0) {
    await saveLog({ dealId, status: 'WARN', message: 'Tradeshow found, but no matching fields to copy.' });
    return {
      success: true,
      message: 'Tradeshow found, but no matching fields to copy.',
      dealId,
      tradeshowFound: true,
      fieldsCopied: 0
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
    updatedPayload: updatePayload
  };
};
