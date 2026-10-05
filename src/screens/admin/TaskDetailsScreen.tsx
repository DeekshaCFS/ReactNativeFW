// src/screens/admin/TaskDetailsScreen.tsx

import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {getTaskById} from '../../api/task/taskService';
import type {
  TasksList,
  TasksListResultData,
  TasksListMultipleItemAssigned,
} from '../../api/task/task.types';
import type {TaskListItem} from './adminLegacyApiTypes';
import {getStringField, getNumberField} from './crmShared';
import {ms, sp} from '../../utils/responsive';
import {formatAmount} from '../../utils/decimal';
import BackBar from '../../components/BackBar';
import {downloadReport} from '../../api/report/reportService';
import AddTaskModal, {buildTaskFormValues, type AddTaskInitialValues} from './AddTaskModal';
import TaskClosureSection, {type TaskClosureSectionHandle} from './TaskClosureSection';
import OwnerTaskTrackingMap from './OwnerTaskTrackingMap';
import {getCurrentCountryCode} from '../../state/session';

type TaskDetailsTask = TasksListResultData | TaskListItem;

type TaskDetailsScreenProps = {
  ownerId: number;
  taskId: number;
  fallbackTask?: TaskDetailsTask | null;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  onBack: () => void;
  /** Stack-pushed use gets the native header (with back) instead. */
  hideBackBar?: boolean;
  /** Embedded under the shared AppHeader without host padding. */
  underAppHeader?: boolean;
  /**
   * Which Java screen this mirrors. 'crm' (default): CRMTaskDetailsFragmentNew
   * (dialog_crm_task_details), opened from customer details. 'taskList': the
   * owner task list, where MainTaskFragmentNew opens TaskDetailsFragmentNew
   * (dialog_task_details) for Completed / Rejected tasks.
   */
  source?: 'crm' | 'taskList';
};

const THEME_PRIMARY = '#c3002f';

const getString = (
  item: Record<string, unknown>,
  camelKey: string,
  pascalKey: string,
) => {
  const value = item[camelKey] ?? item[pascalKey];
  return typeof value === 'string' ? value.trim() : '';
};

const getTaskId = (item: TaskDetailsTask) => Number(item.Id) || 0;

const getNewTaskId = (item: TaskDetailsTask) =>
  getString(item as Record<string, unknown>, 'newTaskId', 'NewTaskId') ||
  getString(item as Record<string, unknown>, 'newTaskID', 'NewTaskID');

const getTaskStatus = (item: TaskDetailsTask) =>
  getString(item as Record<string, unknown>, 'taskStatus', 'TaskStatus') ||
  'Unknown';

const getStatusColor = (status: string) => {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'ongoing') {
    return '#FF9800';
  }
  if (normalized === 'completed') {
    return '#18a957';
  }
  if (normalized === 'rejected') {
    return '#d32f2f';
  }
  if (normalized === 'inactive') {
    return '#7E8794';
  }
  if (normalized === 'onhold') {
    return '#9c27b0';
  }
  return THEME_PRIMARY;
};

const getFieldworkerAvailability = (status: string) => {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'inactive') {
    return 'is currently Absent or Unavailable';
  }
  if (normalized === 'onhold') {
    return 'is currently On Hold';
  }
  if (normalized === 'ongoing') {
    return 'is currently working on this task';
  }
  if (normalized === 'completed') {
    return 'has completed this task';
  }
  if (normalized === 'rejected') {
    return 'has rejected this task';
  }
  return '';
};

const NA = 'NA';

const valueOrNA = (value: string) => (value ? value : NA);

// Java: DateUtils.getDate(epochMillis, "dd-MM-yyyy hh:mm aa") for start/end, and
// convertDateFormat(iso, ..., "dd-MM-yyyy h:mm a") for the OnHold date.
const formatJavaDateTime = (raw: unknown, padHour: boolean) => {
  if (raw === null || raw === undefined || raw === '' || raw === 0) {
    return '';
  }
  const date = typeof raw === 'number' ? new Date(raw) : new Date(String(raw));
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const hours12 = date.getHours() % 12 || 12;
  const meridiem = date.getHours() >= 12 ? 'PM' : 'AM';
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${padHour ? pad(hours12) : hours12}:${pad(date.getMinutes())} ${meridiem}`;
};

const getIssuedQty = (item: TasksListMultipleItemAssigned) => {
  const value = item.ItemQuantity;
  return value === undefined || value === null ? NA : String(value);
};

const getUsedQty = (item: TasksListMultipleItemAssigned) => {
  const value = item.UsedItemQty;
  return value === undefined || value === null ? NA : String(value);
};

const getItemName = (item: TasksListMultipleItemAssigned) =>
  getStringField(item as Record<string, unknown>, ['itemName', 'ItemName']) ||
  'Item';

const openWhatsapp = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return;
  }
  Linking.openURL(`https://wa.me/${digits}`).catch(() => {});
};

const openCall = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return;
  }
  Linking.openURL(`tel:${digits}`).catch(() => {});
};

const TaskDetailsScreen = ({
  ownerId,
  taskId,
  fallbackTask,
  customerName,
  customerPhone,
  customerAddress,
  onBack,
  hideBackBar,
  underAppHeader,
  source = 'crm',
}: TaskDetailsScreenProps) => {
  const closureRef = useRef<TaskClosureSectionHandle>(null);
  const [closureLoaded, setClosureLoaded] = useState(false);
  const [hasQrScans, setHasQrScans] = useState(false);
  const [task, setTask] = useState<TaskDetailsTask | null>(fallbackTask ?? null);
  const [reassignValues, setReassignValues] = useState<AddTaskInitialValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const avatarRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(avatarRotation, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    rotateLoop.start();
    return () => rotateLoop.stop();
  }, [avatarRotation]);

  const avatarRotationStyle = {
    transform: [
      {
        rotate: avatarRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  useEffect(() => {
    let isMounted = true;
    const fetchTaskDetails = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getTaskById({
          UserId: ownerId,
          TaskId: taskId,
        });
        const result: TasksList['ResultData'] = response?.ResultData ?? undefined;
        const item = Array.isArray(result) ? result[0] ?? null : result ?? null;
        if (isMounted && item) {
          setTask(item);
        }
      } catch (fetchError) {
        if (isMounted) {
          const message =
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load task details.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (taskId) {
      fetchTaskDetails();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [ownerId, taskId]);

  const record = (task ?? {}) as Record<string, unknown>;

  const status = task ? getTaskStatus(task) : '';
  const newTaskId = task ? getNewTaskId(task) : '';
  const displayTaskId = newTaskId || (taskId ? String(taskId) : '');

  const taskName = getStringField(record, ['name', 'Name']);
  const taskTag = getStringField(record, [
    'task_TagName',
    'Task_TagName',
    'taskTagName',
    'TaskTagName',
  ]);
  // The Java app never shows the raw PaymentMode string here -- it maps it to
  // a warranty label (CRMTaskDetailsFragmentNew.setData()): "Amc"/"AMC" means
  // the task is covered under warranty, anything else is out of warranty.
  const rawPaymentMode = getStringField(record, ['paymentMode', 'PaymentMode']);
  const paymentMode = rawPaymentMode
    ? rawPaymentMode.toLowerCase() === 'amc'
      ? 'In Warranty'
      : 'Out of Warranty'
    : '';
  const employeeName = getStringField(record, ['assignedTo', 'AssignedTo']);

  const itemDetails =
    (record.itemDetails as TasksListMultipleItemAssigned[] | undefined) ??
    (record.ItemDetails as TasksListMultipleItemAssigned[] | undefined) ??
    (record.multipleItemAssigned as TasksListMultipleItemAssigned[] | undefined) ??
    (record.MultipleItemAssigned as TasksListMultipleItemAssigned[] | undefined) ??
    [];

  const custName =
    getStringField(record, ['customerName', 'CustomerName']) ||
    customerName ||
    '';
  const custPhone =
    getStringField(record, ['contactNo', 'ContactNo']) || customerPhone || '';
  // Java (CRMTaskDetailsFragmentNew.setData()) prefixes the displayed number
  // and the WhatsApp deep link with the session's country code, but leaves
  // the `tel:` call intent using the raw contact number as-is.
  const countryCode = getCurrentCountryCode();
  const custPhoneDisplay = custPhone
    ? countryCode
      ? `+${countryCode} ${custPhone}`
      : custPhone
    : '';
  const custPhoneWhatsapp = countryCode ? `${countryCode}${custPhone}` : custPhone;
  const custAddress =
    getStringField(record, ['fullAddress', 'FullAddress']) ||
    customerAddress ||
    '';
  const landmark = getStringField(record, [
    // Java's CRMTaskDetailsFragmentNew/TaskDetailsFragmentNew both populate
    // the "Landmark" field from LocationDesc -- there is no LandMark field
    // on the task DTO at all.
    'locationDesc',
    'LocationDesc',
  ]);

  // Java shows both Response Code and Satisfaction Code as "NA" together if
  // *either* one is 0 (CRMTaskDetailsFragmentNew.setData()); Satisfaction
  // Code itself comes from HappyCode -- there is no SatisfactionCode field.
  const responseCodeNum = getNumberField(record, ['responseCode', 'ResponseCode']);
  const satisfactionCodeNum = getNumberField(record, ['happyCode', 'HappyCode']);
  const hasCodes = responseCodeNum > 0 && satisfactionCodeNum > 0;
  const responseCode = hasCodes ? String(responseCodeNum) : '';
  const satisfactionCode = hasCodes ? String(satisfactionCodeNum) : '';
  // EstimatedAmount is WagesPerHours, EarnedAmount is EarningAmount (Java setData()).
  const wagesPerHour = getNumberField(record, ['wagesPerHours', 'WagesPerHours']);
  const earningAmount = getNumberField(record, ['earningAmount', 'EarningAmount']);
  const estimatedAmount = wagesPerHour ? `Rs. ${formatAmount(wagesPerHour)}` : '';
  const earnedAmount = earningAmount ? `Rs. ${formatAmount(earningAmount)}` : '';

  // Warranty (Java's txtWarrantyType/.../txtWarrantySerialNo, sourced from
  // TaskWarrantyDetailsModelDtoView on the same task record).
  const warrantyDetail =
    (record.taskWarrantyDetailsModelDtoView as Record<string, unknown> | undefined) ??
    (record.TaskWarrantyDetailsModelDtoView as Record<string, unknown> | undefined) ??
    {};
  const warrantyTypeName = getStringField(warrantyDetail, ['warrantyTypeName', 'WarrantyTypeName']);
  const warrantyStartDate = getStringField(warrantyDetail, ['startDate', 'StartDate']);
  const warrantyEndDate = getStringField(warrantyDetail, ['endDate', 'EndDate']);
  const warrantyBrandName = getStringField(warrantyDetail, ['brandName', 'BrandName']);
  const warrantyModelName = getStringField(warrantyDetail, ['modelName', 'ModelName']);
  const warrantySerialNo = getStringField(warrantyDetail, ['serialNoName', 'SerialNoName']);

  const fieldworkerAvailability = getFieldworkerAvailability(status);
  // Java opens completed tasks with downloadReport + allowToReassign
  // (MainTaskFragmentNew -> TaskDetailsFragmentNew / CRMTaskDetailsFragmentNew).
  const isCompleted = status.toLowerCase() === 'completed';

  const handleDownloadReport = async () => {
    const id = getNumberField(record, ['id', 'Id']) || taskId;
    try {
      const response = await downloadReport({UserId: ownerId, TaskID: id});
      if (response?.Code === '200' && response.Message) {
        await Linking.openURL(response.Message);
      } else {
        Alert.alert('Download Report', response?.Message || 'Could not generate the task report.');
      }
    } catch (err) {
      Alert.alert('Download Report', err instanceof Error ? err.message : 'Could not download the report.');
    }
  };

  const startDateTime = formatJavaDateTime(record.StartDate ?? record.startDate, true);
  const endDateTime = formatJavaDateTime(record.EndDate ?? record.endDate, true);
  // OnHold rows/photos are only shown for OnHold tasks (CRMTaskDetailsFragmentNew).
  const isOnHold = status.replace(/\s/g, '').toLowerCase() === 'onhold';
  const isRejected = status.toLowerCase() === 'rejected';
  const showCompletedLayout = source === 'taskList' && (isCompleted || isRejected);
  // Every other status from the owner task list opens OwnerTaskTrackingFragmentNew.
  const showTrackingLayout = source === 'taskList' && !!task && !showCompletedLayout;
  const serviceName = getStringField(record, ['serviceName', 'ServiceName']);
  const hasWarranty = Boolean(warrantyTypeName || warrantyBrandName || warrantyModelName || warrantySerialNo);

  const renderRows = (rows: [string, string][]) =>
    rows.map(([label, value]) => (
      <View key={label} style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    ));
  const paymentModeId = getNumberField(record, ['paymentModeId', 'PaymentModeId']);
  const onHold =
    (record.OnHoldTaskDtos as Record<string, unknown> | undefined) ??
    (record.onHoldTaskDtos as Record<string, unknown> | undefined) ??
    {};
  const onHoldDateTime = formatJavaDateTime(onHold.CreatedDate ?? onHold.createdDate, false);
  const onHoldReason = getStringField(onHold, ['onHoldNotes', 'OnHoldNotes']);
  const onHoldPhotos = [onHold.Pick1, onHold.Pick2, onHold.Pick3]
    .map(p => String(p ?? '').trim())
    .filter(Boolean);

  return (
    <View style={styles.screen}>
      {hideBackBar ? null : <BackBar onBack={onBack} underAppHeader={underAppHeader} />}

      {showTrackingLayout ? (
        <OwnerTaskTrackingMap
          technicianId={getNumberField(record, ['userId', 'UserId'])}
          technicianName={employeeName}
          isOngoing={status.toLowerCase() === 'ongoing'}
          fieldLatitude={Number(record.Latitude ?? record.latitude) || 0}
          fieldLongitude={Number(record.Longitude ?? record.longitude) || 0}
        />
      ) : null}
      {showCompletedLayout || showTrackingLayout ? null : (
      <View style={styles.avatarWrap}>
        <Animated.View style={[styles.avatarCircle, avatarRotationStyle]}>
          <Text style={styles.avatarIcon}>👤</Text>
        </Animated.View>
        {employeeName ? (
          <Text style={styles.avatarName}>{employeeName}</Text>
        ) : null}
        {fieldworkerAvailability ? (
          <Text style={styles.avatarAvailability}>
            {fieldworkerAvailability}
          </Text>
        ) : null}
      </View>
      )}

      {isLoading && !task ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={THEME_PRIMARY} size="large" />
        </View>
      ) : error && !task ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : showTrackingLayout ? (
        // OwnerTaskTrackingFragmentNew / owner_task_tracking_fragment_new.xml, in XML order.
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.statusActionsRow}>
            <Text style={[styles.statusLabel, {color: getStatusColor(status)}]}>{status || NA}</Text>
            <View style={styles.actionIconsRow}>
              <TouchableOpacity style={styles.actionIconButton} onPress={() => openWhatsapp(custPhoneWhatsapp)}>
                <Text style={styles.actionIconText}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIconButton} onPress={() => openCall(custPhone)}>
                <Text style={styles.actionIconText}>📞</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.sectionHeading}>Task Details</Text>
            {displayTaskId ? <Text style={styles.taskIdText}> [{displayTaskId}]</Text> : null}
          </View>
          {renderRows([
            ['Task Name', valueOrNA(taskName)],
            ['Task Tag', valueOrNA(taskTag)],
            ['Estimated Amount', `Rs. ${formatAmount(wagesPerHour)}`],
            ['Payment Mode', valueOrNA(paymentMode)],
            ['Fieldworker', valueOrNA(employeeName)],
            ...(isOnHold
              ? ([
                  ['OnHold Date & Time', valueOrNA(onHoldDateTime)],
                  ['OnHold Reason', valueOrNA(onHoldReason)],
                ] as [string, string][])
              : []),
          ])}

          <View style={styles.itemDetailsHeaderRow}>
            <Text style={[styles.sectionHeading, styles.itemNameHeading]}>Item Details</Text>
            <Text style={styles.itemColumnHeading}>Issued Qty</Text>
            <Text style={styles.itemColumnHeading}>Used Qty</Text>
          </View>
          {itemDetails.map((item, index) => (
            <View key={index} style={styles.itemDetailsRow}>
              <Text style={styles.itemName} numberOfLines={1}>{getItemName(item)}</Text>
              <Text style={styles.itemQty}>{getIssuedQty(item)}</Text>
              <Text style={styles.itemQty}>{getUsedQty(item)}</Text>
            </View>
          ))}

          <Text style={[styles.sectionHeading, styles.sectionSpacing]}>Customer Details</Text>
          {renderRows([
            ['Customer Name', valueOrNA(custName)],
            ['Customer Number', valueOrNA(custPhoneDisplay)],
            ['Address', valueOrNA(custAddress)],
            ['Landmark', valueOrNA(landmark)],
          ])}

          {serviceName ? (
            <>
              <Text style={[styles.sectionHeading, styles.sectionSpacing]}>Service Details</Text>
              {renderRows([['Service Name', serviceName]])}
            </>
          ) : null}

          <Text style={[styles.sectionHeading, styles.sectionSpacing]}>Code's Detail</Text>
          {renderRows([
            ['Response Code:', valueOrNA(responseCode)],
            ['Satisfaction Code:', valueOrNA(satisfactionCode)],
          ])}

          {hasWarranty ? (
            <>
              <Text style={[styles.sectionHeading, styles.sectionSpacing]}>Warranty Details</Text>
              {renderRows([
                ['Warranty Type', warrantyTypeName || '-NA-'],
                ['Start Date', warrantyStartDate || '-NA-'],
                ['End Date', warrantyEndDate || '-NA-'],
                ['Brand Name', warrantyBrandName || '-NA-'],
                ['Model Name', warrantyModelName || '-NA-'],
                ['Serial No', warrantySerialNo || '-NA-'],
              ])}
            </>
          ) : null}

          {isOnHold && onHoldPhotos.length > 0 ? (
            <>
              <Text style={[styles.sectionHeading, styles.sectionSpacing]}>OnHold Photos</Text>
              <View style={styles.onHoldPhotoRow}>
                {onHoldPhotos.map(uri => (
                  <Image key={uri} source={{uri}} style={styles.onHoldPhoto} />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      ) : showCompletedLayout && task ? (
        // TaskDetailsFragmentNew / dialog_task_details.xml, in XML order.
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.statusActionsRow}>
            <Text style={[styles.statusLabel, {color: getStatusColor(status)}]}>{status || NA}</Text>
            <View style={styles.actionIconsRow}>
              <TouchableOpacity style={styles.actionIconButton} onPress={() => openWhatsapp(custPhoneWhatsapp)}>
                <Text style={styles.actionIconText}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIconButton} onPress={() => openCall(custPhone)}>
                <Text style={styles.actionIconText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={() =>
                  setReassignValues(
                    buildTaskFormValues(task as never, isCompleted ? 'reassignCompleted' : 'reassign'),
                  )
                }>
                <Text style={styles.actionIconText}>↻</Text>
              </TouchableOpacity>
              {hasQrScans ? (
                <TouchableOpacity style={styles.actionIconButton} onPress={() => closureRef.current?.openQrHistory()}>
                  <Text style={styles.actionIconText}>▦</Text>
                </TouchableOpacity>
              ) : null}
              {isCompleted ? (
                <TouchableOpacity style={styles.actionIconButton} onPress={handleDownloadReport}>
                  <Text style={styles.actionIconText}>⬇</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.sectionHeading}>Task Details</Text>
            {displayTaskId ? <Text style={styles.taskIdText}> [{displayTaskId}]</Text> : null}
          </View>
          {(
            [
              ['Task Name', valueOrNA(taskName)],
              ['Task Tag', valueOrNA(taskTag)],
              ['Employee Name', valueOrNA(employeeName)],
              ...(wagesPerHour ? [['Estimated Amount', estimatedAmount]] : []),
              ...(closureLoaded && paymentModeId !== 1 && earningAmount
                ? [['Earned Amount', earnedAmount]]
                : []),
              ['Payment Mode', valueOrNA(paymentMode)],
              ['Start Date & Time', valueOrNA(startDateTime)],
              ['End Date & Time', valueOrNA(endDateTime)],
            ] as [string, string][]
          ).map(([label, value]) => (
            <View key={label} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <Text style={styles.fieldValue}>{value}</Text>
            </View>
          ))}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Attachment</Text>
            <Text style={[styles.fieldValue, styles.linkText]} onPress={() => closureRef.current?.openDocuments()}>
              View Document
            </Text>
          </View>

          <View style={styles.itemDetailsHeaderRow}>
            <Text style={[styles.sectionHeading, styles.itemNameHeading]}>Item Details</Text>
            <Text style={styles.itemColumnHeading}>Issued Qty</Text>
            <Text style={styles.itemColumnHeading}>Used Qty</Text>
          </View>
          {itemDetails.map((item, index) => (
            <View key={index} style={styles.itemDetailsRow}>
              <Text style={styles.itemName} numberOfLines={1}>{getItemName(item)}</Text>
              <Text style={styles.itemQty}>{getIssuedQty(item)}</Text>
              <Text style={styles.itemQty}>{getUsedQty(item)}</Text>
            </View>
          ))}

          <Text style={[styles.sectionHeading, styles.sectionSpacing]}>Customer Details</Text>
          {(
            [
              ['Customer Name', valueOrNA(custName)],
              ['Customer Number', valueOrNA(custPhoneDisplay)],
              ['Address', valueOrNA(custAddress)],
              ['Landmark', valueOrNA(landmark)],
            ] as [string, string][]
          ).map(([label, value]) => (
            <View key={label} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <Text style={styles.fieldValue}>{value}</Text>
            </View>
          ))}

          <TaskClosureSection
            ref={closureRef}
            ownerId={ownerId}
            taskId={getNumberField(record, ['id', 'Id']) || taskId}
            taskName={taskName}
            newTaskId={newTaskId}
            customerId={getNumberField(record, ['customerDetailsid', 'CustomerDetailsid'])}
            isRejected={isRejected}
            paymentMode={rawPaymentMode}
            earningAmount={earningAmount}
            assignedTo={employeeName}
            onClosureLoaded={setClosureLoaded}
            onQrAvailable={setHasQrScans}
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          <View style={styles.statusActionsRow}>
            <Text
              style={[styles.statusLabel, {color: getStatusColor(status)}]}
            >
              {status || NA}
            </Text>
            <View style={styles.actionIconsRow}>
              {isCompleted && task ? (
                <>
                  <TouchableOpacity style={styles.actionIconButton} onPress={handleDownloadReport}>
                    <Text style={styles.actionIconText}>⬇</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIconButton}
                    onPress={() =>
                      setReassignValues(buildTaskFormValues(task as never, 'reassignCompleted'))
                    }>
                    <Text style={styles.actionIconText}>↻</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={() => openWhatsapp(custPhoneWhatsapp)}
              >
                <Text style={styles.actionIconText}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={() => openCall(custPhone)}
              >
                <Text style={styles.actionIconText}>📞</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.sectionHeading}>Task Details</Text>
            {displayTaskId ? (
              <Text style={styles.taskIdText}> [{displayTaskId}]</Text>
            ) : null}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Task Name</Text>
            <Text style={styles.fieldValue}>{valueOrNA(taskName)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Task Tag</Text>
            <Text style={styles.fieldValue}>{valueOrNA(taskTag)}</Text>
          </View>
          {/* Row order follows dialog_crm_task_details.xml. Task Type is
              'gone' there, so it isn't shown here either. */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Estimated Amount</Text>
            <Text style={styles.fieldValue}>{valueOrNA(estimatedAmount)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payment Mode</Text>
            <Text style={styles.fieldValue}>{valueOrNA(paymentMode)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Employee Name</Text>
            <Text style={styles.fieldValue}>{valueOrNA(employeeName)}</Text>
          </View>
          {isOnHold ? (
            <>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>OnHold Date & Time</Text>
                <Text style={styles.fieldValue}>{valueOrNA(onHoldDateTime)}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>OnHold Reason</Text>
                <Text style={styles.fieldValue}>{valueOrNA(onHoldReason)}</Text>
              </View>
            </>
          ) : null}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Earned Amount</Text>
            <Text style={styles.fieldValue}>{valueOrNA(earnedAmount)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Start Date & Time</Text>
            <Text style={styles.fieldValue}>{valueOrNA(startDateTime)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>End Date & Time</Text>
            <Text style={styles.fieldValue}>{valueOrNA(endDateTime)}</Text>
          </View>

          <View style={styles.itemDetailsHeaderRow}>
            <Text style={[styles.sectionHeading, styles.itemNameHeading]}>
              Item Details
            </Text>
            <Text style={styles.itemColumnHeading}>Issued Qty</Text>
            <Text style={styles.itemColumnHeading}>Used Qty</Text>
          </View>
          {itemDetails.length > 0 ? (
            itemDetails.map((item, index) => (
              <View key={index} style={styles.itemDetailsRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {getItemName(item)}
                </Text>
                <Text style={styles.itemQty}>{getIssuedQty(item)}</Text>
                <Text style={styles.itemQty}>{getUsedQty(item)}</Text>
              </View>
            ))
          ) : null}


          <Text style={[styles.sectionHeading, styles.sectionSpacing]}>
            Customer Details
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Customer Name</Text>
            <Text style={styles.fieldValue}>{valueOrNA(custName)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Customer Number</Text>
            <Text style={styles.fieldValue}>{valueOrNA(custPhoneDisplay)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Address</Text>
            <Text style={styles.fieldValue}>{valueOrNA(custAddress)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Landmark</Text>
            <Text style={styles.fieldValue}>
              {landmark ? landmark : 'na'}
            </Text>
          </View>

          {/* Warranty Details is always visible in Java, after Customer Details. */}
          {(
            <>
              <Text style={[styles.sectionHeading, styles.sectionSpacing]}>
                Warranty Details
              </Text>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Warranty Type</Text>
                <Text style={styles.fieldValue}>{valueOrNA(warrantyTypeName)}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Start Date</Text>
                <Text style={styles.fieldValue}>{valueOrNA(warrantyStartDate)}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>End Date</Text>
                <Text style={styles.fieldValue}>{valueOrNA(warrantyEndDate)}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Brand Name</Text>
                <Text style={styles.fieldValue}>{valueOrNA(warrantyBrandName)}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Model Name</Text>
                <Text style={styles.fieldValue}>{valueOrNA(warrantyModelName)}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Serial No</Text>
                <Text style={styles.fieldValue}>{valueOrNA(warrantySerialNo)}</Text>
              </View>
            </>
          )}

          <Text style={[styles.sectionHeading, styles.sectionSpacing]}>
            Code's Detail
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Response Code:</Text>
            <Text style={styles.fieldValue}>{valueOrNA(responseCode)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Satisfaction Code:</Text>
            <Text style={styles.fieldValue}>
              {valueOrNA(satisfactionCode)}
            </Text>
          </View>

          {isOnHold && onHoldPhotos.length > 0 ? (
            <>
              <Text style={[styles.sectionHeading, styles.sectionSpacing]}>
                OnHold Photos
              </Text>
              <View style={styles.onHoldPhotoRow}>
                {onHoldPhotos.map(uri => (
                  <Image key={uri} source={{uri}} style={styles.onHoldPhoto} />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      )}

      <AddTaskModal
        visible={reassignValues !== null}
        ownerId={ownerId}
        initialValues={reassignValues}
        onClose={() => setReassignValues(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
  },
  header: {
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    padding: ms(4),
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: sp(18),
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: ms(16),
  },
  linkText: {
    color: '#1a73e8',
    textDecorationLine: 'underline',
  },
  onHoldPhotoRow: {
    flexDirection: 'row',
    gap: ms(10),
    marginTop: ms(8),
  },
  onHoldPhoto: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(8),
    backgroundColor: '#f3f4f6',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: sp(13),
    paddingHorizontal: ms(24),
    textAlign: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
  },
  bodyContent: {
    paddingHorizontal: ms(16),
    paddingTop: ms(16),
    paddingBottom: ms(32),
    width: '100%',
    maxWidth: ms(640),
    alignSelf: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    paddingHorizontal: ms(24),
    paddingBottom: ms(24),
  },
  avatarCircle: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(12),
  },
  avatarIcon: {
    fontSize: sp(30),
    color: THEME_PRIMARY,
  },
  avatarName: {
    color: '#FFFFFF',
    fontSize: sp(16),
    fontWeight: '700',
    marginBottom: ms(4),
    textAlign: 'center',
  },
  avatarAvailability: {
    color: '#FFFFFF',
    fontSize: sp(12),
    textAlign: 'center',
  },
  statusActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(12),
  },
  statusLabel: {
    fontSize: sp(13),
    fontWeight: '700',
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: ms(20),
  },
  actionIconButton: {
    padding: ms(2),
  },
  actionIconText: {
    fontSize: sp(18),
    color: THEME_PRIMARY,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(10),
  },
  sectionHeading: {
    fontSize: sp(13),
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSpacing: {
    marginTop: ms(16),
    marginBottom: ms(4),
  },
  taskIdText: {
    fontSize: sp(13),
    fontWeight: '600',
    color: '#1565c0',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ms(6),
  },
  fieldLabel: {
    fontSize: sp(13),
    color: '#1F2937',
    flex: 1,
  },
  fieldValue: {
    fontSize: sp(13),
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'left',
  },
  itemDetailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: ms(16),
    marginBottom: ms(8),
  },
  itemNameHeading: {
    flex: 1,
  },
  itemColumnHeading: {
    fontSize: sp(13),
    fontWeight: '700',
    color: '#1F2937',
    width: ms(80),
    textAlign: 'center',
  },
  itemDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ms(6),
  },
  itemName: {
    fontSize: sp(13),
    color: '#1F2937',
    flex: 1,
  },
  itemQty: {
    fontSize: sp(13),
    color: '#9CA3AF',
    width: ms(80),
    textAlign: 'center',
  },
});

export default TaskDetailsScreen;