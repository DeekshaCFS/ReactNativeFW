// src/screens/admin/AddTaskModal.tsx

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';
import {getExpenseUserList} from '../../api/expenditure/expenditureService';
import type {ExpenseTechListResultData} from '../../api/expenditure/expenditure.types';
import {getCustomerList, getCityList, getStateList} from '../../api/customerList/customerListService';
import type {CityDTOResultData, CustomerListResultData, StateDTOResultData} from '../../api/customerList/customerList.types';
import {getServiceTypeList} from '../../api/services/servicesService';
import type {ServiceTypeListDTOResultData} from '../../api/services/services.types';
import {getQuoteBindList} from '../../api/quotation/quotationService';
import type {QuoteBindListDTOResultData} from '../../api/quotation/quotation.types';
import {getFsrBindList} from '../../api/fsrManagement/fsrManagementService';
import type {FSRBindListDTOResultData} from '../../api/fsrManagement/fsrManagement.types';
import {getLargeItemAssignedUnassigned} from '../../api/item/itemService';
import type {ItemsListResultData} from '../../api/item/item.types';
import {getTaskTagList} from '../../api/task/taskService';
import type {TagListResultData} from '../../api/task/task.types';
import {addTask} from '../../api/taskList/taskListService';
import type {AddTaskResultData, AddTaskMultipleItemAssigned} from '../../api/taskList/taskList.types';
import {
  THEME_PRIMARY,
  buildServiceTree,
  extractArray,
  filterCustomerOptions,
  filterLookupOptions,
  filterServiceTree,
  getCurrentTimeString,
  getNumberField,
  getStringField,
  getTodayDateString,
  normalizeCityOption,
  normalizeCustomerOption,
  normalizeStateOption,
  normalizeTaskTag,
  styles,
  type CityOption,
  type CustomerOption,
  type ServiceNode,
  type StateOption,
  type TaskTagOption,
} from './CRMScreen';

Sound.setCategory('Playback');

export type AddTaskInitialValues = {
  title: string;
  address: string;
  state: string;
  city: string;
  pinCode: string;
  landmark: string;
  customerName: string;
  customerNumber: string;
  taskTagId: number;
  taskTagName: string;
  // Optional AMC-service prefill (used when adding a task from AMCDetailsScreen,
  // matching Java's AMCDetailsFragment -> HomeActivityNew.addTask(...) flow).
  customerId?: number;
  productBrand?: string;
  modelNumber?: string;
  amcServiceDetailsId?: number;
};

type AddTaskModalProps = {
  visible: boolean;
  onClose: () => void;
  ownerId: number;
  initialValues?: AddTaskInitialValues | null;
};

type TaskFormTabKey = 'cust' | 'items' | 'service' | 'quote' | 'fsr' | 'inst';

const TASK_FORM_TABS: {key: TaskFormTabKey; label: string}[] = [
  {key: 'cust', label: 'Cust.'},
  {key: 'items', label: 'Items'},
  {key: 'service', label: 'Service'},
  {key: 'quote', label: 'Quote'},
  {key: 'fsr', label: 'FSR'},
  {key: 'inst', label: 'Inst.'},
];

const getFieldworkerName = (item: ExpenseTechListResultData) => {
  const record = item as Record<string, unknown>;
  const fullName = `${getStringField(record, [
    'firstName',
    'FirstName',
  ])} ${getStringField(record, ['lastName', 'LastName'])}`.trim();

  return (
    getStringField(record, [
      'employeeName',
      'EmployeeName',
      'userName',
      'UserName',
    ]) ||
    getStringField(record, ['name', 'Name']) ||
    fullName ||
    'Fieldworker'
  );
};

const getFieldworkerId = (item: ExpenseTechListResultData) => {
  const record = item as Record<string, unknown>;
  const value = record.userId ?? record.UserId;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

type ItemOption = {
  id: number;
  name: string;
  availableQuantity: number;
  price: number;
};

const normalizeItemOption = (item: ItemsListResultData): ItemOption => {
  const record = item as Record<string, unknown>;
  return {
    id: getNumberField(record, ['itemId', 'ItemId', 'id', 'Id']),
    name: getStringField(record, ['itemName', 'ItemName', 'name', 'Name']),
    availableQuantity: getNumberField(record, [
      'availableQuantity',
      'AvailableQuantity',
      'availableQty',
      'AvailableQty',
      'unAssignedQuantity',
      'UnAssignedQuantity',
    ]),
    price: getNumberField(record, [
      'salesPrice',
      'SalesPrice',
      'purchasePrice',
      'PurchasePrice',
    ]),
  };
};

type QuoteOption = {
  id: number;
  label: string;
};

const normalizeQuoteOption = (item: QuoteBindListDTOResultData): QuoteOption => ({
  id: getNumberField(item as Record<string, unknown>, [
    'quotationId',
    'QuotationId',
    'quoteId',
    'QuoteId',
    'id',
    'Id',
  ]),
  label: getStringField(item as Record<string, unknown>, [
    'quotationTitle',
    'QuotationTitle',
    'quoteTitle',
    'QuoteTitle',
    'title',
    'Title',
    'subject',
    'Subject',
    'quotationName',
    'QuotationName',
    'quoteName',
    'QuoteName',
    'name',
    'Name',
  ]),
});

type FSROption = {
  id: number;
  label: string;
};

const normalizeFSROption = (item: FSRBindListDTOResultData): FSROption => ({
  id: getNumberField(item as Record<string, unknown>, [
    'fsrId',
    'FSRId',
    'fsrNumber',
    'FSRNumber',
    'id',
    'Id',
  ]),
  label: getStringField(item as Record<string, unknown>, [
    'fsrTitle',
    'FSRTitle',
    'fsrName',
    'FSRName',
    'fsrNo',
    'FSRNo',
    'title',
    'Title',
    'subject',
    'Subject',
    'name',
    'Name',
  ]),
});

type TaskItemRow = {
  rowId: string;
  itemId: number;
  itemName: string;
  availableQuantity: number;
  price: number;
  quantity: string;
};

let taskItemRowSequence = 0;
const createEmptyTaskItemRow = (): TaskItemRow => {
  taskItemRowSequence += 1;
  return {
    rowId: `item-row-${taskItemRowSequence}`,
    itemId: 0,
    itemName: '',
    availableQuantity: 0,
    price: 0,
    quantity: '',
  };
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  ownerId,
  initialValues,
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState(getTodayDateString());
  const [taskTime, setTaskTime] = useState(getCurrentTimeString());
  const [selectedFieldworker, setSelectedFieldworker] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isFieldworkerModalOpen, setIsFieldworkerModalOpen] = useState(false);
  const [allFieldworkers, setAllFieldworkers] = useState<
    ExpenseTechListResultData[]
  >([]);
  const [isFieldworkerLoading, setIsFieldworkerLoading] = useState(false);
  const [fieldworkerSearch, setFieldworkerSearch] = useState('');

  const [taskTags, setTaskTags] = useState<TaskTagOption[]>([]);
  const [isTaskTagLoading, setIsTaskTagLoading] = useState(false);
  const [isAddTaskTagModalOpen, setIsAddTaskTagModalOpen] = useState(false);
  const [addTaskTagSearch, setAddTaskTagSearch] = useState('');
  const [selectedAddTaskTag, setSelectedAddTaskTag] =
    useState<TaskTagOption | null>(null);

  const [warrantyMode, setWarrantyMode] = useState<'in' | 'out'>('in');
  const [amcAmount, setAmcAmount] = useState('');
  const [taskAmcServiceDetailsId, setTaskAmcServiceDetailsId] = useState(0);

  const [taskAddress, setTaskAddress] = useState('');
  const [taskState, setTaskState] = useState('');
  const [taskStateId, setTaskStateId] = useState(0);
  const [taskCity, setTaskCity] = useState('');
  const [taskCityId, setTaskCityId] = useState(0);
  const [taskPinCode, setTaskPinCode] = useState('');
  const [taskLandmark, setTaskLandmark] = useState('');
  const [taskProductBrand, setTaskProductBrand] = useState('');
  const [taskModelNumber, setTaskModelNumber] = useState('');
  const [taskLatitude, setTaskLatitude] = useState('');
  const [taskLongitude, setTaskLongitude] = useState('');

  const [activeTaskFormTab, setActiveTaskFormTab] =
    useState<TaskFormTabKey>('cust');

  const [taskCustomerId, setTaskCustomerId] = useState(0);
  const [taskCustomerName, setTaskCustomerName] = useState('');
  const [taskCustomerNumber, setTaskCustomerNumber] = useState('');
  const [taskCustomerSuggestions, setTaskCustomerSuggestions] = useState<
    CustomerOption[]
  >([]);
  const [showTaskCustomerSuggestions, setShowTaskCustomerSuggestions] =
    useState(false);
  const [allCustomerOptions, setAllCustomerOptions] = useState<
    CustomerOption[]
  >([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);

  const [allStateOptions, setAllStateOptions] = useState<StateOption[]>([]);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [taskStateSuggestions, setTaskStateSuggestions] = useState<
    StateOption[]
  >([]);
  const [showTaskStateSuggestions, setShowTaskStateSuggestions] =
    useState(false);

  const [taskAllCityOptions, setTaskAllCityOptions] = useState<CityOption[]>(
    [],
  );
  const [isTaskCityLoading, setIsTaskCityLoading] = useState(false);
  const [taskCitySuggestions, setTaskCitySuggestions] = useState<
    CityOption[]
  >([]);
  const [showTaskCitySuggestions, setShowTaskCitySuggestions] =
    useState(false);

  const [taskItemRows, setTaskItemRows] = useState<TaskItemRow[]>([
    createEmptyTaskItemRow(),
  ]);
  const [activeItemRowId, setActiveItemRowId] = useState<string | null>(null);
  const [isItemSearchModalOpen, setIsItemSearchModalOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [allItemOptions, setAllItemOptions] = useState<ItemOption[]>([]);
  const [isItemSearchLoading, setIsItemSearchLoading] = useState(false);

  const [serviceTree, setServiceTree] = useState<ServiceNode[]>([]);
  const [isServiceTypeLoading, setIsServiceTypeLoading] = useState(false);
  const [serviceTypeError, setServiceTypeError] = useState('');
  const [taskServiceTypeSearch, setTaskServiceTypeSearch] = useState('');
  const [isTaskServiceModalOpen, setIsTaskServiceModalOpen] = useState(false);
  const [selectedTaskService, setSelectedTaskService] =
    useState<ServiceNode | null>(null);

  const [quoteList, setQuoteList] = useState<QuoteOption[]>([]);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [quoteSearch, setQuoteSearch] = useState('');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteOption | null>(null);

  const [fsrList, setFsrList] = useState<FSROption[]>([]);
  const [isFsrLoading, setIsFsrLoading] = useState(false);
  const [fsrError, setFsrError] = useState('');
  const [fsrSearch, setFsrSearch] = useState('');
  const [isFsrModalOpen, setIsFsrModalOpen] = useState(false);
  const [selectedFsr, setSelectedFsr] = useState<FSROption | null>(null);

  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const [taskSpecialInstructions, setTaskSpecialInstructions] = useState('');
  const [isRecordingInstruction, setIsRecordingInstruction] = useState(false);
  const [isPlayingInstruction, setIsPlayingInstruction] = useState(false);
  const [instructionRecordSeconds, setInstructionRecordSeconds] = useState(0);
  const [instructionAudioPath, setInstructionAudioPath] = useState('');
  const instructionTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const instructionSoundRef = useRef<Sound | null>(null);
  const isAudioRecordInitialized = useRef(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setTaskTitle(initialValues?.title ?? '');
    setTaskDate(getTodayDateString());
    setTaskTime(getCurrentTimeString());
    setSelectedFieldworker(null);
    setFieldworkerSearch('');
    const tagId = initialValues?.taskTagId ?? 0;
    const tagName = initialValues?.taskTagName ?? '';
    setSelectedAddTaskTag(
      tagId || tagName ? {id: tagId, label: tagName || 'Task'} : null,
    );
    setAddTaskTagSearch('');
    setWarrantyMode('in');
    setAmcAmount('');
    setTaskAmcServiceDetailsId(initialValues?.amcServiceDetailsId ?? 0);
    setTaskAddress(initialValues?.address ?? '');
    setTaskState(initialValues?.state ?? '');
    setTaskStateId(0);
    setTaskCity(initialValues?.city ?? '');
    setTaskCityId(0);
    setTaskAllCityOptions([]);
    setTaskCitySuggestions([]);
    setShowTaskStateSuggestions(false);
    setShowTaskCitySuggestions(false);
    setTaskPinCode(initialValues?.pinCode ?? '');
    setTaskLandmark(initialValues?.landmark ?? '');
    setTaskProductBrand(initialValues?.productBrand ?? '');
    setTaskModelNumber(initialValues?.modelNumber ?? '');
    setTaskLatitude('');
    setTaskLongitude('');
    setActiveTaskFormTab('cust');
    setTaskCustomerId(initialValues?.customerId ?? 0);
    setTaskCustomerName(initialValues?.customerName ?? '');
    setTaskCustomerNumber(initialValues?.customerNumber ?? '');
    setTaskCustomerSuggestions([]);
    setShowTaskCustomerSuggestions(false);
    setSelectedTaskService(null);
    setTaskServiceTypeSearch('');
    setSelectedQuote(null);
    setQuoteSearch('');
    setSelectedFsr(null);
    setFsrSearch('');
    setTaskSpecialInstructions('');
    setInstructionAudioPath('');
    setInstructionRecordSeconds(0);
    setIsRecordingInstruction(false);
    setIsPlayingInstruction(false);
    setTaskItemRows([createEmptyTaskItemRow()]);
    setActiveItemRowId(null);
    setIsItemSearchModalOpen(false);
    setItemSearchQuery('');
  }, [visible, initialValues]);

  const loadFieldworkers = useCallback(() => {
    if (allFieldworkers.length > 0 || isFieldworkerLoading) {
      return;
    }
    setIsFieldworkerLoading(true);
    getExpenseUserList({ownerId})
      .then(response => {
        setAllFieldworkers(extractArray<ExpenseTechListResultData>(response));
      })
      .catch(() => setAllFieldworkers([]))
      .finally(() => setIsFieldworkerLoading(false));
  }, [allFieldworkers.length, isFieldworkerLoading, ownerId]);

  const displayedFieldworkers = useMemo(() => {
    const query = fieldworkerSearch.trim().toLowerCase();
    if (!query) {
      return allFieldworkers;
    }
    return allFieldworkers.filter(item =>
      getFieldworkerName(item).toLowerCase().includes(query),
    );
  }, [allFieldworkers, fieldworkerSearch]);

  const handleFieldworkerSelect = (item: ExpenseTechListResultData) => {
    setSelectedFieldworker({
      id: getFieldworkerId(item),
      name: getFieldworkerName(item),
    });
    setIsFieldworkerModalOpen(false);
    setFieldworkerSearch('');
  };

  const loadTaskTags = useCallback(() => {
    if (taskTags.length > 0 || isTaskTagLoading) {
      return;
    }
    setIsTaskTagLoading(true);
    getTaskTagList({userId: ownerId})
      .then(response => {
        const items = extractArray<TagListResultData>(response);
        setTaskTags(
          items
            .map(normalizeTaskTag)
            .filter(option => option.label && option.label !== 'Task'),
        );
      })
      .catch(() => setTaskTags([]))
      .finally(() => setIsTaskTagLoading(false));
  }, [isTaskTagLoading, ownerId, taskTags.length]);

  const loadServiceTypes = useCallback(() => {
    if (serviceTree.length > 0 || isServiceTypeLoading) {
      return;
    }
    setIsServiceTypeLoading(true);
    setServiceTypeError('');
    getServiceTypeList({
      OwnerId: ownerId,
      searchParam: '',
    })
      .then(response => {
        const items = extractArray<ServiceTypeListDTOResultData>(response);
        setServiceTree(
          buildServiceTree(
            items as unknown as Parameters<typeof buildServiceTree>[0],
          ),
        );
      })
      .catch(error => {
        setServiceTree([]);
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load service types right now.';
        setServiceTypeError(message);
      })
      .finally(() => setIsServiceTypeLoading(false));
  }, [isServiceTypeLoading, ownerId, serviceTree.length]);

  const loadQuoteList = useCallback(() => {
    if (quoteList.length > 0 || isQuoteLoading) {
      return;
    }
    setIsQuoteLoading(true);
    setQuoteError('');
    getQuoteBindList({
      userId: ownerId,
      searchParam: '',
    })
      .then(response => {
        const items = extractArray<QuoteBindListDTOResultData>(response);
        setQuoteList(
          items.map(normalizeQuoteOption).filter(option => option.label),
        );
      })
      .catch(error => {
        setQuoteList([]);
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load quotes right now.';
        setQuoteError(message);
      })
      .finally(() => setIsQuoteLoading(false));
  }, [isQuoteLoading, ownerId, quoteList.length]);

  const displayedQuoteList = useMemo(() => {
    const query = quoteSearch.trim().toLowerCase();
    if (!query) {
      return quoteList;
    }
    return quoteList.filter(option =>
      option.label.toLowerCase().includes(query),
    );
  }, [quoteList, quoteSearch]);

  const loadFsrList = useCallback(() => {
    if (fsrList.length > 0 || isFsrLoading) {
      return;
    }
    setIsFsrLoading(true);
    setFsrError('');
    getFsrBindList({
      userId: ownerId,
      searchParam: '',
    })
      .then(response => {
        const items = extractArray<FSRBindListDTOResultData>(response);
        setFsrList(
          items.map(normalizeFSROption).filter(option => option.label),
        );
      })
      .catch(error => {
        setFsrList([]);
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load FSR list right now.';
        setFsrError(message);
      })
      .finally(() => setIsFsrLoading(false));
  }, [fsrList.length, isFsrLoading, ownerId]);

  const displayedFsrList = useMemo(() => {
    const query = fsrSearch.trim().toLowerCase();
    if (!query) {
      return fsrList;
    }
    return fsrList.filter(option =>
      option.label.toLowerCase().includes(query),
    );
  }, [fsrList, fsrSearch]);

  const MAX_INSTRUCTION_RECORD_SECONDS = 30;

  const clearInstructionTimer = useCallback(() => {
    if (instructionTimerRef.current) {
      clearInterval(instructionTimerRef.current);
      instructionTimerRef.current = null;
    }
  }, []);

  const stopInstructionRecording = useCallback(async () => {
    clearInstructionTimer();
    if (!isRecordingInstruction) {
      return;
    }
    try {
      const audioFile = await AudioRecord.stop();
      try {
        const stat = await RNFS.stat(audioFile);
        if (Number(stat.size) <= 44) {
          console.warn('[AddTask] Recorded instruction file is empty', audioFile);
          Alert.alert(
            'Add Task',
            'Recording did not capture any audio. Please try again.',
          );
          setInstructionAudioPath('');
          return;
        }
      } catch (statError) {
        console.warn('[AddTask] Recorded instruction file not found', statError);
        Alert.alert('Add Task', 'Unable to save the recorded instruction.');
        setInstructionAudioPath('');
        return;
      }
      setInstructionAudioPath(audioFile);
    } catch (error) {
      console.warn('[AddTask] Unable to save recorded instruction', error);
      Alert.alert('Add Task', 'Unable to save the recorded instruction.');
    } finally {
      setIsRecordingInstruction(false);
    }
  }, [clearInstructionTimer, isRecordingInstruction]);

  const startInstructionRecording = useCallback(async () => {
    if (isRecordingInstruction) {
      return;
    }
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Add Task',
          'Microphone permission is required to record instructions.',
        );
        return;
      }
    }

    if (instructionSoundRef.current) {
      instructionSoundRef.current.stop();
      instructionSoundRef.current.release();
      instructionSoundRef.current = null;
      setIsPlayingInstruction(false);
    }

    AudioRecord.init({
      sampleRate: 44100,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: `task_instruction_${Date.now()}.wav`,
    });
    isAudioRecordInitialized.current = true;

    setInstructionAudioPath('');
    setInstructionRecordSeconds(0);
    AudioRecord.start();
    setIsRecordingInstruction(true);

    instructionTimerRef.current = setInterval(() => {
      setInstructionRecordSeconds(prev => {
        const next = prev + 1;
        if (next >= MAX_INSTRUCTION_RECORD_SECONDS) {
          stopInstructionRecording();
          return MAX_INSTRUCTION_RECORD_SECONDS;
        }
        return next;
      });
    }, 1000);
  }, [isRecordingInstruction, stopInstructionRecording]);

  const playInstructionRecording = useCallback(() => {
    if (isRecordingInstruction) {
      Alert.alert('Add Task', 'Please stop recording first.');
      return;
    }
    if (isPlayingInstruction) {
      return;
    }
    if (!instructionAudioPath) {
      Alert.alert('Add Task', 'Please record an instruction first.');
      return;
    }
    if (instructionSoundRef.current) {
      instructionSoundRef.current.stop();
      instructionSoundRef.current.release();
      instructionSoundRef.current = null;
    }
    const sound = new Sound(instructionAudioPath, '', error => {
      if (error) {
        console.warn('[AddTask] Unable to load recorded instruction', error);
        Alert.alert('Add Task', 'Unable to play the recorded instruction.');
        instructionSoundRef.current = null;
        return;
      }
      setIsPlayingInstruction(true);
      sound.play(success => {
        if (!success) {
          console.warn('[AddTask] Playback finished unsuccessfully');
        }
        setIsPlayingInstruction(false);
        sound.release();
        instructionSoundRef.current = null;
      });
    });
    instructionSoundRef.current = sound;
  }, [instructionAudioPath, isRecordingInstruction, isPlayingInstruction]);

  useEffect(() => {
    if (!visible) {
      clearInstructionTimer();
      if (isRecordingInstruction && isAudioRecordInitialized.current) {
        AudioRecord.stop().catch(() => {});
      }
      if (instructionSoundRef.current) {
        instructionSoundRef.current.stop();
        instructionSoundRef.current.release();
        instructionSoundRef.current = null;
      }
      setIsRecordingInstruction(false);
      setIsPlayingInstruction(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const instructionTimerLabel = useMemo(() => {
    const minutes = Math.floor(instructionRecordSeconds / 60);
    const seconds = instructionRecordSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0',
    )}`;
  }, [instructionRecordSeconds]);

  const loadTaskCustomerSuggestions = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 2) {
        setTaskCustomerSuggestions([]);
        return;
      }

      if (allCustomerOptions.length > 0) {
        setTaskCustomerSuggestions(
          filterCustomerOptions(allCustomerOptions, trimmedQuery),
        );
        return;
      }

      if (isCustomerLoading) {
        return;
      }

      setIsCustomerLoading(true);
      try {
        const response =
          await getCustomerList({
          userId: ownerId,
            customerTagId: 0,
          });
        const normalized = extractArray<CustomerListResultData>(response)
          .map((item, index) =>
            normalizeCustomerOption(
              item as unknown as Parameters<typeof normalizeCustomerOption>[0],
              index,
            ),
          )
          .filter((option): option is CustomerOption => Boolean(option));
        setAllCustomerOptions(normalized);
        setTaskCustomerSuggestions(
          filterCustomerOptions(normalized, trimmedQuery),
        );
      } catch {
        setTaskCustomerSuggestions([]);
      } finally {
        setIsCustomerLoading(false);
      }
    },
    [allCustomerOptions, isCustomerLoading, ownerId],
  );

  useEffect(() => {
    const query = taskCustomerName.trim();
    if (!showTaskCustomerSuggestions || query.length < 2) {
      setTaskCustomerSuggestions([]);
      return;
    }

    if (allCustomerOptions.length > 0) {
      setTaskCustomerSuggestions(filterCustomerOptions(allCustomerOptions, query));
      return;
    }

    const timeoutId = setTimeout(() => {
      loadTaskCustomerSuggestions(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    allCustomerOptions,
    taskCustomerName,
    loadTaskCustomerSuggestions,
    showTaskCustomerSuggestions,
  ]);

  const handleTaskCustomerSelect = (customer: CustomerOption) => {
    setTaskCustomerId(customer.id);
    setTaskCustomerName(customer.name);
    setTaskCustomerNumber(customer.phone);
    if (customer.address) {
      setTaskAddress(customer.address);
    }
    setTaskStateId(0);
    if (customer.state) {
      setTaskState(customer.state);
    }
    setTaskCityId(0);
    setTaskAllCityOptions([]);
    setTaskCitySuggestions([]);
    if (customer.city) {
      setTaskCity(customer.city);
    }
    if (customer.pinCode) {
      setTaskPinCode(customer.pinCode);
    }
    if (customer.landmark) {
      setTaskLandmark(customer.landmark);
    }
    if (customer.productBrand) {
      setTaskProductBrand(customer.productBrand);
    }
    setTaskLatitude(customer.latitude || '');
    setTaskLongitude(customer.longitude || '');
    setTaskCustomerSuggestions([]);
    setShowTaskCustomerSuggestions(false);
  };

  const geocodeAddress = useCallback(async (fullAddress: string) => {
    const query = fullAddress.trim();
    if (!query) {
      return null;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          query,
        )}`,
        {headers: {Accept: 'application/json'}},
      );
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const {lat, lon} = results[0];
        if (lat && lon) {
          return {latitude: String(lat), longitude: String(lon)};
        }
      }
    } catch (error) {
      console.warn('[AddTask] Unable to geocode address', error);
    }
    return null;
  }, []);

  const loadTaskStateSuggestions = useCallback(
    async (query: string) => {
      if (allStateOptions.length > 0) {
        setTaskStateSuggestions(filterLookupOptions(allStateOptions, query));
        setIsStateLoading(false);
        return;
      }

      if (isStateLoading) {
        return;
      }

      setIsStateLoading(true);
      try {
        const response = await getStateList();
        const normalized = extractArray<StateDTOResultData>(response)
          .map(
            item =>
              normalizeStateOption(
                item as unknown as Parameters<typeof normalizeStateOption>[0],
              ),
          )
          .filter(option => option.id > 0 && option.name);
        setAllStateOptions(normalized);
        setTaskStateSuggestions(filterLookupOptions(normalized, query));
      } catch {
        setTaskStateSuggestions([]);
      } finally {
        setIsStateLoading(false);
      }
    },
    [allStateOptions, isStateLoading],
  );

  const preloadTaskStates = useCallback(() => {
    if (allStateOptions.length > 0 || isStateLoading) {
      return;
    }
    loadTaskStateSuggestions(taskState);
  }, [allStateOptions.length, isStateLoading, loadTaskStateSuggestions, taskState]);

  useEffect(() => {
    const query = taskState.trim();
    if (!showTaskStateSuggestions || query.length < 2) {
      setTaskStateSuggestions([]);
      return;
    }

    if (allStateOptions.length > 0) {
      setTaskStateSuggestions(filterLookupOptions(allStateOptions, query));
      return;
    }

    const timeoutId = setTimeout(() => {
      loadTaskStateSuggestions(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [allStateOptions, loadTaskStateSuggestions, showTaskStateSuggestions, taskState]);

  const loadTaskCitySuggestions = useCallback(
    async (query: string, forStateId: number) => {
      if (!forStateId) {
        setTaskCitySuggestions([]);
        return;
      }

      if (taskAllCityOptions.length > 0) {
        setTaskCitySuggestions(filterLookupOptions(taskAllCityOptions, query));
        setIsTaskCityLoading(false);
        return;
      }

      if (isTaskCityLoading) {
        return;
      }

      setIsTaskCityLoading(true);
      try {
        const response = await getCityList({
        userId: ownerId,
          stateId: forStateId,
        });
        const normalized = extractArray<CityDTOResultData>(response)
          .map(
            item =>
              normalizeCityOption(
                item as unknown as Parameters<typeof normalizeCityOption>[0],
              ),
          )
          .filter(option => option.id > 0 && option.name);
        setTaskAllCityOptions(normalized);
        setTaskCitySuggestions(filterLookupOptions(normalized, query));
      } catch {
        setTaskCitySuggestions([]);
      } finally {
        setIsTaskCityLoading(false);
      }
    },
    [taskAllCityOptions, isTaskCityLoading, ownerId],
  );

  const preloadTaskCities = useCallback(() => {
    if (!taskStateId) {
      return;
    }
    if (taskAllCityOptions.length > 0 || isTaskCityLoading) {
      return;
    }
    loadTaskCitySuggestions(taskCity, taskStateId);
  }, [
    taskAllCityOptions.length,
    taskCity,
    isTaskCityLoading,
    loadTaskCitySuggestions,
    taskStateId,
  ]);

  useEffect(() => {
    const query = taskCity.trim();
    if (!showTaskCitySuggestions || !taskStateId || query.length < 2) {
      setTaskCitySuggestions([]);
      return;
    }

    if (taskAllCityOptions.length > 0) {
      setTaskCitySuggestions(filterLookupOptions(taskAllCityOptions, query));
      return;
    }

    const timeoutId = setTimeout(() => {
      loadTaskCitySuggestions(query, taskStateId);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    taskAllCityOptions,
    taskCity,
    loadTaskCitySuggestions,
    showTaskCitySuggestions,
    taskStateId,
  ]);

  const handleTaskStateSelect = (option: StateOption) => {
    setTaskStateId(option.id);
    setTaskState(option.name);
    setTaskStateSuggestions([]);
    setShowTaskStateSuggestions(false);

    setTaskCity('');
    setTaskCityId(0);
    setTaskAllCityOptions([]);
    setTaskCitySuggestions([]);
  };

  const handleTaskCitySelect = (option: CityOption) => {
    setTaskCityId(option.id);
    setTaskCity(option.name);
    setTaskCitySuggestions([]);
    setShowTaskCitySuggestions(false);
  };

  const MAX_TASK_ITEM_ROWS = 10;

  const loadItemOptions = useCallback(
    (searchParam: string) => {
      setIsItemSearchLoading(true);
      getLargeItemAssignedUnassigned({ownerId, searchParam})
        .then(response => {
          const items = extractArray<ItemsListResultData>(response);
          setAllItemOptions(
            items.map(normalizeItemOption).filter(option => option.name),
          );
        })
        .catch(() => setAllItemOptions([]))
        .finally(() => setIsItemSearchLoading(false));
    },
    [ownerId],
  );

  useEffect(() => {
    if (!isItemSearchModalOpen) {
      return;
    }
    const query = itemSearchQuery.trim();
    if (query.length < 3) {
      setAllItemOptions([]);
      return;
    }
    const timeoutId = setTimeout(() => {
      loadItemOptions(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [isItemSearchModalOpen, itemSearchQuery, loadItemOptions]);

  const itemSearchResults = useMemo(() => {
    if (itemSearchQuery.trim().length < 3) {
      return [];
    }
    return allItemOptions;
  }, [allItemOptions, itemSearchQuery]);

  const openItemSearchModal = (rowId: string) => {
    setActiveItemRowId(rowId);
    setItemSearchQuery('');
    setAllItemOptions([]);
    setIsItemSearchModalOpen(true);
  };

  const handleItemOptionSelect = (option: ItemOption) => {
    const isDuplicate = taskItemRows.some(
      row => row.rowId !== activeItemRowId && row.itemId === option.id,
    );
    if (isDuplicate) {
      Alert.alert('Add Task', 'This item has already been added.');
      return;
    }
    setTaskItemRows(prev =>
      prev.map(row =>
        row.rowId === activeItemRowId
          ? {
              ...row,
              itemId: option.id,
              itemName: option.name,
              availableQuantity: option.availableQuantity,
              price: option.price,
            }
          : row,
      ),
    );
    setIsItemSearchModalOpen(false);
    setActiveItemRowId(null);
    setItemSearchQuery('');
  };

  const updateItemRowQuantity = (rowId: string, quantity: string) => {
    setTaskItemRows(prev =>
      prev.map(row => {
        if (row.rowId !== rowId) {
          return row;
        }
        if (
          quantity !== '' &&
          row.availableQuantity > 0 &&
          Number(quantity) > row.availableQuantity
        ) {
          Alert.alert(
            'Add Task',
            `Quantity should not be greater than available quantity (${row.availableQuantity}).`,
          );
          return row;
        }
        return {...row, quantity};
      }),
    );
  };

  const addItemRow = () => {
    const lastRow = taskItemRows[taskItemRows.length - 1];
    if (lastRow && lastRow.itemName) {
      if (!lastRow.quantity || Number(lastRow.quantity) <= 0) {
        Alert.alert('Add Task', 'Item Quantity should not be zero.');
        return;
      }
      if (
        lastRow.availableQuantity > 0 &&
        Number(lastRow.quantity) > lastRow.availableQuantity
      ) {
        Alert.alert(
          'Add Task',
          `Quantity should not be greater than available quantity (${lastRow.availableQuantity}).`,
        );
        return;
      }
    }
    setTaskItemRows(prev => {
      if (prev.length >= MAX_TASK_ITEM_ROWS) {
        Alert.alert(
          'Add Task',
          `You can add a maximum of ${MAX_TASK_ITEM_ROWS} items.`,
        );
        return prev;
      }
      return [...prev, createEmptyTaskItemRow()];
    });
  };

  const removeItemRow = (rowId: string) => {
    setTaskItemRows(prev => {
      if (prev.length <= 1) {
        return [createEmptyTaskItemRow()];
      }
      return prev.filter(row => row.rowId !== rowId);
    });
  };

  const renderTaskServiceNode = useCallback(
    (node: ServiceNode, depth: number): React.ReactNode => {
      const isLeaf = node.children.length === 0;
      const isSelectable = isLeaf || depth >= 2;

      return (
        <View key={node.key}>
          {isSelectable ? (
            <TouchableOpacity
              style={styles.serviceLeafRow}
              onPress={() => {
                setSelectedTaskService(node);
                setIsTaskServiceModalOpen(false);
                setTaskServiceTypeSearch('');
              }}
            >
              <Text style={styles.serviceLeafBullet}>•</Text>
              <Text
                style={[
                  styles.serviceLeafText,
                  selectedTaskService?.id === node.id
                    ? styles.serviceLeafTextSelected
                    : null,
                ]}
              >
                {node.label}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={
                depth === 0
                  ? styles.serviceHeaderText
                  : styles.serviceSubHeaderText
              }
            >
              {node.label}
            </Text>
          )}
          {node.children.map(child => renderTaskServiceNode(child, depth + 1))}
        </View>
      );
    },
    [selectedTaskService],
  );

  const displayedTaskServiceTree = useMemo(
    () => filterServiceTree(serviceTree, taskServiceTypeSearch),
    [serviceTree, taskServiceTypeSearch],
  );

  const displayedAddTaskTags = useMemo(
    () =>
      addTaskTagSearch.trim()
        ? taskTags.filter(tag =>
            tag.label
              .toLowerCase()
              .includes(addTaskTagSearch.trim().toLowerCase()),
          )
        : taskTags,
    [addTaskTagSearch, taskTags],
  );

  const handleAddTaskSubmit = async () => {
    if (isSubmittingTask) {
      return;
    }
    if (!taskTitle.trim()) {
      Alert.alert('Add Task', 'Please enter a Task Title.');
      return;
    }
    if (!taskAddress.trim()) {
      Alert.alert('Add Task', 'Please enter Customer Address.');
      return;
    }
    if (!taskState.trim() || !taskCity.trim()) {
      Alert.alert('Add Task', 'Please enter State and City.');
      return;
    }
    if (!taskPinCode.trim()) {
      Alert.alert('Add Task', 'Please enter Pin Code.');
      return;
    }
    const hasInvalidItemQuantity = taskItemRows.some(
      row => row.itemName && Number(row.quantity) <= 0,
    );
    if (hasInvalidItemQuantity) {
      Alert.alert('Add Task', 'Item Quantity should not be zero.');
      return;
    }

    setIsSubmittingTask(true);

    let resolvedLatitude = taskLatitude;
    let resolvedLongitude = taskLongitude;
    if (!resolvedLatitude || !resolvedLongitude) {
      const fullAddress = [
        taskAddress.trim(),
        taskCity.trim(),
        taskState.trim(),
        taskPinCode.trim(),
      ]
        .filter(Boolean)
        .join(', ');
      const geocoded = await geocodeAddress(fullAddress);
      if (geocoded) {
        resolvedLatitude = geocoded.latitude;
        resolvedLongitude = geocoded.longitude;
        setTaskLatitude(geocoded.latitude);
        setTaskLongitude(geocoded.longitude);
      }
    }

    const multipleItemAssigned: AddTaskMultipleItemAssigned[] = taskItemRows
      .filter(row => row.itemId > 0 && Number(row.quantity) > 0)
      .map(row => ({
        ItemId: row.itemId,
        ItemIssuedId: 0,
        ItemName: row.itemName,
        ItemQuantity: Number(row.quantity),
        TempTechSrNo: 0,
        UsedItemQty: 0,
      }));

    const payload: AddTaskResultData = {
      AMCServiceDetailsId: taskAmcServiceDetailsId,
      Address: taskAddress.trim(),
      AudioFilePath: instructionAudioPath || '',
      BrandName: taskProductBrand.trim(),
      City: taskCity.trim(),
      ContactNo: taskCustomerNumber.trim(),
      CountryDetailsId: 0,
      CreatedBy: ownerId,
      CustomerDetailsid: taskCustomerId,
      CustomerName: taskCustomerName.trim(),
      CustomerTagId: 0,
      Description: taskSpecialInstructions.trim(),
      EnquiryId: 0,
      FSRId: selectedFsr?.id || 0,
      Id: 0,
      IsActive: true,
      IsModelError: true,
      IsSuccessful: true,
      ItemId: 0,
      ItemQuantity: 0,
      LeadId: 0,
      LocDescription: taskPinCode.trim(),
      LocIsActive: true,
      LocName: '',
      LocationId: taskCityId,
      Longitude: resolvedLongitude,
      ModelNumber: taskModelNumber.trim(),
      MultipleItemAssigned: multipleItemAssigned,
      Name: taskTitle.trim(),
      NewAddedTaskId: 0,
      OnHoldTaskId: 0,
      PaymentMode: warrantyMode === 'out' ? 'Rate' : 'AMC',
      PaymentModeId: warrantyMode === 'out' ? 2 : 1,
      PinCode: taskPinCode.trim(),
      QuotationId: selectedQuote?.id || 0,
      ServiceId: selectedTaskService?.id || 0,
      State: taskState.trim(),
      TaskDate: taskDate,
      TaskStatus: 4,
      TaskTagId: selectedAddTaskTag?.id || 0,
      TaskType: 1,
      Time: taskTime,
      UpdatedBy: ownerId,
      UserId: selectedFieldworker?.id || ownerId,
      WagesPerHour: warrantyMode === 'out' ? Number(amcAmount) || 0 : 0,
      latitude: resolvedLatitude,
    };

    try {
      await addTask(payload);
      Alert.alert('Add Task', 'Task added successfully.');
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to add task right now.';
      Alert.alert('Add Task', message);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Add Task</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              style={styles.modalFlex}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.fieldWrap}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Task Title *"
                    placeholderTextColor="#9aa0a6"
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.floatingFieldHalf}>
                    <Text style={styles.floatingLabel}>Date *</Text>
                    <TextInput
                      style={styles.floatingInput}
                      value={taskDate}
                      onChangeText={setTaskDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9aa0a6"
                    />
                  </View>
                  <View style={styles.floatingFieldHalf}>
                    <Text style={styles.floatingLabel}>Time *</Text>
                    <TextInput
                      style={styles.floatingInput}
                      value={taskTime}
                      onChangeText={setTaskTime}
                      placeholder="HH:MM:SS"
                      placeholderTextColor="#9aa0a6"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.dropdownPill}
                  onPress={() => {
                    loadFieldworkers();
                    setIsFieldworkerModalOpen(true);
                  }}
                >
                  <Text
                    style={
                      selectedFieldworker
                        ? styles.dropdownPillTextValue
                        : styles.dropdownPillTextPlaceholder
                    }
                    numberOfLines={1}
                  >
                    {selectedFieldworker
                      ? selectedFieldworker.name
                      : 'Select Fieldworker'}
                  </Text>
                  <Text style={styles.dropdownChevron}>⌄</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownPill}
                  onPress={() => {
                    loadTaskTags();
                    setIsAddTaskTagModalOpen(true);
                  }}
                >
                  <Text
                    style={
                      selectedAddTaskTag
                        ? styles.dropdownPillTextValue
                        : styles.dropdownPillTextPlaceholder
                    }
                    numberOfLines={1}
                  >
                    {selectedAddTaskTag
                      ? selectedAddTaskTag.label
                      : 'Select Task Tag'}
                  </Text>
                  <Text style={styles.dropdownChevron}>⌄</Text>
                </TouchableOpacity>

                <View style={styles.warrantyRow}>
                  <View style={styles.warrantyToggleGroup}>
                    <TouchableOpacity
                      style={[
                        styles.warrantyToggleButton,
                        styles.warrantyToggleButtonLeft,
                        warrantyMode === 'in' &&
                          styles.warrantyToggleButtonActive,
                      ]}
                      onPress={() => setWarrantyMode('in')}
                    >
                      <Text
                        style={
                          warrantyMode === 'in'
                            ? styles.warrantyToggleTextActive
                            : styles.warrantyToggleText
                        }
                      >
                        In Warranty
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.warrantyToggleButton,
                        styles.warrantyToggleButtonRight,
                        warrantyMode === 'out' &&
                          styles.warrantyToggleButtonActive,
                      ]}
                      onPress={() => setWarrantyMode('out')}
                    >
                      <Text
                        style={
                          warrantyMode === 'out'
                            ? styles.warrantyToggleTextActive
                            : styles.warrantyToggleText
                        }
                      >
                        Out of Warranty
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.amcDisabledField}>
                    <TextInput
                      style={[
                        styles.amcDisabledInput,
                        warrantyMode === 'out' ? styles.amcEnabledInput : null,
                      ]}
                      value={warrantyMode === 'out' ? amcAmount : ''}
                      onChangeText={text =>
                        setAmcAmount(text.replace(/[^0-9.]/g, ''))
                      }
                      editable={warrantyMode === 'out'}
                      keyboardType="numeric"
                      placeholder={
                        warrantyMode === 'out'
                          ? 'Please Enter Amount'
                          : 'Not Applicable In AMC Mode'
                      }
                      placeholderTextColor="#9aa0a6"
                    />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Customer Address *"
                    placeholderTextColor="#9aa0a6"
                    value={taskAddress}
                    onChangeText={setTaskAddress}
                  />
                </View>

                <View style={[styles.fieldRow, styles.stateCityFieldRow]}>
                  <View style={[styles.floatingFieldHalf, styles.stateFieldWrap]}>
                    <Text style={styles.floatingLabel}>State *</Text>
                    <TextInput
                      style={styles.floatingInput}
                      value={taskState}
                      onChangeText={text => {
                        setTaskState(text);
                        setTaskStateId(0);
                        setShowTaskStateSuggestions(true);
                      }}
                      onFocus={() => {
                        setShowTaskStateSuggestions(true);
                        preloadTaskStates();
                      }}
                    />
                    {showTaskStateSuggestions &&
                    taskState.trim().length >= 2 &&
                    (isStateLoading || taskStateSuggestions.length > 0) ? (
                      <View style={styles.suggestionBox}>
                        {isStateLoading ? (
                          <ActivityIndicator
                            color={THEME_PRIMARY}
                            size="small"
                            style={styles.suggestionLoader}
                          />
                        ) : (
                          <ScrollView
                            style={styles.suggestionScroll}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                          >
                            {taskStateSuggestions.map(option => (
                              <TouchableOpacity
                                key={option.id}
                                style={styles.suggestionItem}
                                onPress={() => handleTaskStateSelect(option)}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={styles.suggestionItemText}
                                >
                                  {option.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    ) : null}
                  </View>
                  <View style={[styles.floatingFieldHalf, styles.cityFieldWrap]}>
                    <Text style={styles.floatingLabel}>City *</Text>
                    <TextInput
                      style={styles.floatingInput}
                      value={taskCity}
                      onChangeText={text => {
                        setTaskCity(text);
                        setTaskCityId(0);
                        setShowTaskCitySuggestions(true);
                      }}
                      onFocus={() => {
                        if (!taskStateId) {
                          Alert.alert('Add Task', 'Please select a State first.');
                          return;
                        }
                        setShowTaskCitySuggestions(true);
                        preloadTaskCities();
                      }}
                    />
                    {showTaskCitySuggestions &&
                    taskCity.trim().length >= 2 &&
                    (isTaskCityLoading || taskCitySuggestions.length > 0) ? (
                      <View style={styles.suggestionBox}>
                        {isTaskCityLoading ? (
                          <ActivityIndicator
                            color={THEME_PRIMARY}
                            size="small"
                            style={styles.suggestionLoader}
                          />
                        ) : (
                          <ScrollView
                            style={styles.suggestionScroll}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                          >
                            {taskCitySuggestions.map(option => (
                              <TouchableOpacity
                                key={option.id}
                                style={styles.suggestionItem}
                                onPress={() => handleTaskCitySelect(option)}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={styles.suggestionItemText}
                                >
                                  {option.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <View style={styles.floatingFieldFull}>
                    <Text style={styles.floatingLabel}>Pin Code *</Text>
                    <TextInput
                      style={styles.floatingInput}
                      value={taskPinCode}
                      onChangeText={text =>
                        setTaskPinCode(text.replace(/[^0-9]/g, '').slice(0, 6))
                      }
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Landmark *"
                    placeholderTextColor="#9aa0a6"
                    value={taskLandmark}
                    onChangeText={setTaskLandmark}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.floatingFieldHalf}>
                    <TextInput
                      style={styles.floatingInput}
                      placeholder="Product Brand"
                      placeholderTextColor="#9aa0a6"
                      value={taskProductBrand}
                      onChangeText={setTaskProductBrand}
                    />
                  </View>
                  <View style={styles.floatingFieldHalf}>
                    <TextInput
                      style={styles.floatingInput}
                      placeholder="Model Number"
                      placeholderTextColor="#9aa0a6"
                      value={taskModelNumber}
                      onChangeText={setTaskModelNumber}
                    />
                  </View>
                </View>

                <View style={styles.taskFormTabsRow}>
                  {TASK_FORM_TABS.map(tab => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[
                        styles.taskFormTabButton,
                        activeTaskFormTab === tab.key
                          ? styles.taskFormTabButtonActive
                          : null,
                      ]}
                      onPress={() => setActiveTaskFormTab(tab.key)}
                    >
                      <Text
                        style={
                          activeTaskFormTab === tab.key
                            ? styles.taskFormTabTextActive
                            : styles.taskFormTabText
                        }
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {activeTaskFormTab === 'cust' ? (
                  <>
                    <View style={[styles.fieldWrap, styles.customerFieldWrap]}>
                      <TextInput
                        style={styles.pillInput}
                        placeholder="Customer Name"
                        placeholderTextColor="#9aa0a6"
                        value={taskCustomerName}
                        onChangeText={text => {
                          setTaskCustomerName(text);
                          setShowTaskCustomerSuggestions(true);
                        }}
                        onFocus={() => setShowTaskCustomerSuggestions(true)}
                      />
                      {showTaskCustomerSuggestions &&
                      taskCustomerSuggestions.length > 0 ? (
                        <View style={styles.suggestionBox}>
                          {isCustomerLoading ? (
                            <ActivityIndicator
                              color={THEME_PRIMARY}
                              size="small"
                              style={styles.suggestionLoader}
                            />
                          ) : null}
                          <ScrollView
                            style={styles.suggestionScroll}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                          >
                            {taskCustomerSuggestions.map(option => (
                              <TouchableOpacity
                                key={option.id}
                                style={styles.suggestionItem}
                                onPress={() => handleTaskCustomerSelect(option)}
                              >
                                <Text style={styles.suggestionItemText}>
                                  {option.name}
                                </Text>
                                {option.phone ? (
                                  <Text style={styles.suggestionItemSubText}>
                                    {option.phone}
                                  </Text>
                                ) : null}
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.fieldWrap}>
                      <View style={styles.pillInputRow}>
                        <TextInput
                          style={styles.pillInputFlex}
                          placeholder="Customer Number"
                          placeholderTextColor="#9aa0a6"
                          value={taskCustomerNumber}
                          onChangeText={setTaskCustomerNumber}
                          keyboardType="phone-pad"
                        />
                        <Text style={styles.contactPickerIcon}>👤</Text>
                      </View>
                    </View>
                  </>
                ) : activeTaskFormTab === 'service' ? (
                  <TouchableOpacity
                    style={styles.dropdownPill}
                    onPress={() => {
                      loadServiceTypes();
                      setIsTaskServiceModalOpen(true);
                    }}
                  >
                    <Text
                      style={
                        selectedTaskService
                          ? styles.dropdownPillTextValue
                          : styles.dropdownPillTextPlaceholder
                      }
                      numberOfLines={1}
                    >
                      {selectedTaskService
                        ? selectedTaskService.label
                        : 'Select Service'}
                    </Text>
                    <Text style={styles.dropdownChevron}>⌄</Text>
                  </TouchableOpacity>
                ) : activeTaskFormTab === 'quote' ? (
                  <TouchableOpacity
                    style={styles.dropdownPill}
                    onPress={() => {
                      loadQuoteList();
                      setIsQuoteModalOpen(true);
                    }}
                  >
                    <Text
                      style={
                        selectedQuote
                          ? styles.dropdownPillTextValue
                          : styles.dropdownPillTextPlaceholder
                      }
                      numberOfLines={1}
                    >
                      {selectedQuote ? selectedQuote.label : 'Select Quote'}
                    </Text>
                    <Text style={styles.dropdownChevron}>⌄</Text>
                  </TouchableOpacity>
                ) : activeTaskFormTab === 'fsr' ? (
                  <TouchableOpacity
                    style={styles.dropdownPill}
                    onPress={() => {
                      loadFsrList();
                      setIsFsrModalOpen(true);
                    }}
                  >
                    <Text
                      style={
                        selectedFsr
                          ? styles.dropdownPillTextValue
                          : styles.dropdownPillTextPlaceholder
                      }
                      numberOfLines={1}
                    >
                      {selectedFsr ? selectedFsr.label : 'Select FSR'}
                    </Text>
                    <Text style={styles.dropdownChevron}>⌄</Text>
                  </TouchableOpacity>
                ) : activeTaskFormTab === 'items' ? (
                  <View>
                    {taskItemRows.map((row, index) => (
                      <View key={row.rowId} style={styles.itemRowCard}>
                        <View style={styles.itemRowHeader}>
                          <Text style={styles.itemRowTitle}>
                            Item #{index + 1}
                          </Text>
                          <TouchableOpacity
                            onPress={() => removeItemRow(row.rowId)}
                          >
                            <Text style={styles.itemRowRemove}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.itemRowFieldsRow}>
                          <TouchableOpacity
                            style={[styles.dropdownPill, styles.itemNameDropdown]}
                            onPress={() => openItemSearchModal(row.rowId)}
                          >
                            <Text
                              style={
                                row.itemName
                                  ? styles.dropdownPillTextValue
                                  : styles.dropdownPillTextPlaceholder
                              }
                              numberOfLines={1}
                            >
                              {row.itemName || 'Item Name'}
                            </Text>
                            <Text style={styles.dropdownChevron}>⌄</Text>
                          </TouchableOpacity>
                          <View style={styles.itemAvailableQtyBox}>
                            <Text style={styles.itemAvailableQtyText}>
                              {row.price}
                            </Text>
                          </View>
                          <TextInput
                            style={[styles.pillInput, styles.itemQuantityInput]}
                            placeholder="Item Quantity"
                            placeholderTextColor="#9aa0a6"
                            keyboardType="number-pad"
                            value={row.quantity}
                            onChangeText={text =>
                              updateItemRowQuantity(
                                row.rowId,
                                text.replace(/[^0-9]/g, ''),
                              )
                            }
                          />
                        </View>
                      </View>
                    ))}
                    {taskItemRows.length < MAX_TASK_ITEM_ROWS ? (
                      <TouchableOpacity onPress={addItemRow}>
                        <Text style={styles.addMoreText}>+ Add More</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : activeTaskFormTab === 'inst' ? (
                  <>
                    <View style={styles.instructionRecorderBox}>
                      <Text style={styles.instructionRecorderLabel}>
                        Record your Instructions (Limit up to 30 Sec)
                      </Text>
                      <View style={styles.instructionRecorderButtonsRow}>
                        <TouchableOpacity
                          style={[
                            styles.instructionRecorderButton,
                            !instructionAudioPath ||
                            isRecordingInstruction ||
                            isPlayingInstruction
                              ? styles.instructionRecorderButtonDisabled
                              : null,
                          ]}
                          onPress={playInstructionRecording}
                        >
                          <Text style={styles.instructionRecorderButtonIcon}>
                            ▶
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.instructionRecorderButton,
                            styles.instructionRecorderMicButton,
                            isRecordingInstruction || isPlayingInstruction
                              ? styles.instructionRecorderButtonDisabled
                              : null,
                          ]}
                          disabled={isRecordingInstruction || isPlayingInstruction}
                          onPress={startInstructionRecording}
                        >
                          <Text style={styles.instructionRecorderButtonIcon}>
                            🎤
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.instructionRecorderButton,
                            !isRecordingInstruction
                              ? styles.instructionRecorderButtonDisabled
                              : null,
                          ]}
                          disabled={!isRecordingInstruction}
                          onPress={stopInstructionRecording}
                        >
                          <Text style={styles.instructionRecorderButtonIcon}>
                            ■
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.instructionRecorderTimerText}>
                        {instructionTimerLabel}
                      </Text>
                    </View>

                    <View style={styles.fieldWrap}>
                      <TextInput
                        style={styles.pillInput}
                        placeholder="Special Instructions"
                        placeholderTextColor="#9aa0a6"
                        value={taskSpecialInstructions}
                        onChangeText={setTaskSpecialInstructions}
                      />
                    </View>
                  </>
                ) : (
                  <View style={styles.tabContentPlaceholder}>
                    <Text style={styles.tabContentPlaceholderText}>
                      No data available.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.darkAddButton}
                  onPress={handleAddTaskSubmit}
                  disabled={isSubmittingTask}
                >
                  {isSubmittingTask ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.addButtonIcon}>📄</Text>
                      <Text style={styles.darkAddButtonText}>ADD</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} disabled={isSubmittingTask}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isFieldworkerModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsFieldworkerModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsFieldworkerModalOpen(false)}
        >
          <Pressable style={styles.taskTagModalBox} onPress={() => {}}>
            <Text style={styles.taskTagModalTitle}>Select Fieldworker</Text>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search..."
                placeholderTextColor="#9aa0a6"
                value={fieldworkerSearch}
                onChangeText={setFieldworkerSearch}
              />
            </View>
            {isFieldworkerLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : (
              <ScrollView style={styles.taskTagModalScroll}>
                {displayedFieldworkers.map(item => {
                  const name = getFieldworkerName(item);
                  const isSelected = selectedFieldworker?.id === getFieldworkerId(item);
                  return (
                    <TouchableOpacity
                      key={getFieldworkerId(item) || name}
                      style={styles.taskTagItem}
                      onPress={() => handleFieldworkerSelect(item)}
                    >
                      <Text
                        style={[
                          styles.taskTagItemText,
                          isSelected ? styles.serviceLeafTextSelected : null,
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {displayedFieldworkers.length === 0 ? (
                  <Text style={styles.emptyText}>No fieldworkers found.</Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isAddTaskTagModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAddTaskTagModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsAddTaskTagModalOpen(false)}
        >
          <Pressable style={styles.taskTagModalBox} onPress={() => {}}>
            <Text style={styles.taskTagModalTitle}>Select Task Tag</Text>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search..."
                placeholderTextColor="#9aa0a6"
                value={addTaskTagSearch}
                onChangeText={setAddTaskTagSearch}
              />
              <Text style={styles.searchModalIcon}>🔍</Text>
            </View>
            {isTaskTagLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : (
              <ScrollView style={styles.taskTagModalScroll}>
                {displayedAddTaskTags.map(tag => (
                  <TouchableOpacity
                    key={tag.id}
                    style={styles.taskTagItem}
                    onPress={() => {
                      setSelectedAddTaskTag(tag);
                      setIsAddTaskTagModalOpen(false);
                      setAddTaskTagSearch('');
                    }}
                  >
                    <Text style={styles.taskTagItemText}>{tag.label}</Text>
                  </TouchableOpacity>
                ))}
                {displayedAddTaskTags.length === 0 ? (
                  <Text style={styles.emptyText}>No task tags found.</Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isItemSearchModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsItemSearchModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsItemSearchModalOpen(false)}
        >
          <Pressable style={styles.taskTagModalBox} onPress={() => {}}>
            <Text style={styles.taskTagModalTitle}>Select Item</Text>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Pls Enter Min 3 Characters."
                placeholderTextColor="#9aa0a6"
                value={itemSearchQuery}
                onChangeText={setItemSearchQuery}
                autoFocus
              />
            </View>
            {isItemSearchLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : itemSearchQuery.trim().length < 3 ? (
              <Text style={styles.itemSearchHintText}>
                Pls Enter Min 3 Characters.
              </Text>
            ) : (
              <ScrollView
                style={styles.taskTagModalScroll}
                keyboardShouldPersistTaps="handled"
              >
                {itemSearchResults.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.taskTagItem}
                    onPress={() => handleItemOptionSelect(option)}
                  >
                    <Text style={styles.taskTagItemText}>{option.name}</Text>
                  </TouchableOpacity>
                ))}
                {itemSearchResults.length === 0 ? (
                  <Text style={styles.emptyText}>No items found.</Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isTaskServiceModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTaskServiceModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsTaskServiceModalOpen(false)}
        >
          <Pressable style={styles.serviceModalBox} onPress={() => {}}>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search..."
                placeholderTextColor="#9aa0a6"
                value={taskServiceTypeSearch}
                onChangeText={setTaskServiceTypeSearch}
              />
              <Text style={styles.searchModalIcon}>🔍</Text>
            </View>
            {isServiceTypeLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : (
              <ScrollView style={styles.serviceModalScroll}>
                {displayedTaskServiceTree.map(node =>
                  renderTaskServiceNode(node, 0),
                )}
                {displayedTaskServiceTree.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {serviceTypeError || 'No service types found.'}
                  </Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isQuoteModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsQuoteModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsQuoteModalOpen(false)}
        >
          <Pressable style={styles.taskTagModalBox} onPress={() => {}}>
            <Text style={styles.taskTagModalTitle}>Select Quote</Text>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search..."
                placeholderTextColor="#9aa0a6"
                value={quoteSearch}
                onChangeText={setQuoteSearch}
              />
            </View>
            {isQuoteLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : (
              <ScrollView style={styles.taskTagModalScroll}>
                {displayedQuoteList.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.taskTagItem}
                    onPress={() => {
                      setSelectedQuote(option);
                      setIsQuoteModalOpen(false);
                      setQuoteSearch('');
                    }}
                  >
                    <Text style={styles.taskTagItemText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
                {displayedQuoteList.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {quoteError || 'No quotes found.'}
                  </Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isFsrModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsFsrModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsFsrModalOpen(false)}
        >
          <Pressable style={styles.taskTagModalBox} onPress={() => {}}>
            <Text style={styles.taskTagModalTitle}>Select FSR</Text>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search..."
                placeholderTextColor="#9aa0a6"
                value={fsrSearch}
                onChangeText={setFsrSearch}
              />
            </View>
            {isFsrLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : (
              <ScrollView style={styles.taskTagModalScroll}>
                {displayedFsrList.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.taskTagItem}
                    onPress={() => {
                      setSelectedFsr(option);
                      setIsFsrModalOpen(false);
                      setFsrSearch('');
                    }}
                  >
                    <Text style={styles.taskTagItemText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
                {displayedFsrList.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {fsrError || 'No FSR found.'}
                  </Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default AddTaskModal;