package com.corefield.fieldweb.FieldWeb.FOC;

import static com.facebook.FacebookSdk.getApplicationContext;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DatePickerDialog;
import android.app.Dialog;
import android.app.SearchManager;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.text.InputFilter;
import android.text.TextWatcher;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.SearchView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.DefaultItemAnimator;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.corefield.fieldweb.Adapter.FOCAdapter.FOCListAdapter;
import com.corefield.fieldweb.DTO.Delete.DeleteEMPDTO;
import com.corefield.fieldweb.DTO.FOC.GetDeleteFOCReqItem;
import com.corefield.fieldweb.DTO.FOC.GetFOCList;
import com.corefield.fieldweb.DTO.FOC.GetFOCStatusTagList;
import com.corefield.fieldweb.DTO.Item.ItemIssueList;
import com.corefield.fieldweb.DTO.Item.ItemsList;
import com.corefield.fieldweb.DTO.User.UsersList;
import com.corefield.fieldweb.FieldWeb.Admin.ItemInventoryTabHost;
import com.corefield.fieldweb.FieldWeb.Dialogs.FWDialog;
import com.corefield.fieldweb.FieldWeb.Dialogs.ServiceDialog;
import com.corefield.fieldweb.FieldWeb.HomeActivityNew;
import com.corefield.fieldweb.FieldWeb.ServiceManagement.ServiceManagementFragment;
import com.corefield.fieldweb.FieldWeb.Task.TaskRequestItems_FW;
import com.corefield.fieldweb.Listener.RecyclerTouchListener;
import com.corefield.fieldweb.R;
import com.corefield.fieldweb.Retrofit.RetrofitClient;
import com.corefield.fieldweb.Util.CommonFunction;
import com.corefield.fieldweb.Util.Connectivity;
import com.corefield.fieldweb.Util.Constant;
import com.corefield.fieldweb.Util.DateUtils;
import com.corefield.fieldweb.Util.FWLogger;
import com.corefield.fieldweb.Util.PaginationScrollListener;
import com.corefield.fieldweb.Util.SharedPrefManager;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

import retrofit2.Call;
import retrofit2.Response;

/**
 * Fragment Controller for Tasks
 *
 * @author CoreField
 * @version 1.4.0
 * @implNote This Fragment class is used to show list of task according to task type and status
 */
@SuppressLint("ValidFragment")
public class FOCFragment extends Fragment implements DatePickerDialog.OnDateSetListener, RecyclerTouchListener {

    private static final String TAG = FOCFragment.class.getSimpleName();
    private View mRootView;
    private List<GetFOCList.ResultData> mGetFOCLists;
    private FOCListAdapter mFOCListAdapter;
    private LinearLayoutManager mLayoutManager;
    private int mUserGroup;
    private int mTaskTypeId = 0, mTaskStatusId = 0, mTaskTagId = 0;

    private static final int PAGE_START = 1;
    private boolean isLoading = false;
    private boolean isLastPage = false;
    private int TOTAL_PAGES = 0;
    private int mCurrentPage = PAGE_START;
    int mTypeCheck = 0, mStatusCheck = 0, mMonthYearCheck = 0;
    private boolean isLoadFirstTime = false;
    private String mSearchParam = "";
    private boolean mSearchFilter = false;
    GetFOCList.ResultData mResultData;
    private boolean isAllData = false;
    private Calendar mCal;
    private int mYear, mMonth, mDay;
    public static Context mcontext;

    private int zoneID = 0, issueTypeId = 0;
    Button plusFocReq;
    String currentMonthName = "";
    ImageView noResultImg;
    TextView SpinTaskTag, spin_issue, resetlist;
    private String assignedTaskTagName = "", issueTypeName = "";
    private int assignedTaskTagId;

    public ArrayList<String> mItemsNameList;
    public ArrayList<String> mUsersNameList;
    private RecyclerView mRecyclerViewQuotationList;
    RecyclerTouchListener recyclerTouchListener;
    Fragment fragment;
    private FOCListAdapter mquotationListAdapter;
    private SearchView mSearchView;
    public List<GetFOCList.ResultData> mQuotationList = null;
    public List<GetFOCStatusTagList.ResultData> mStatusTagList = null;
    public List<ItemIssueList.ResultData> mItemsIssueLists = null;
    public ArrayList<String> mItemsIssueNameList;
    private int ownerID = 0;
    private LinearLayout lnlFocRequest;

    public List<ItemsList.ResultData> mItemsListsTech = null;

    @SuppressLint("ValidFragment")
    public FOCFragment() {
        FWLogger.logInfo(TAG, "Constructor");
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        FWLogger.logInfo(TAG, "onCreateView");
        mRootView = inflater.inflate(R.layout.foc_fragment, container, false);
        mUserGroup = SharedPrefManager.getInstance(getContext()).getUserGroupId();
        SpinTaskTag = mRootView.findViewById(R.id.spin_status_tag);
        spin_issue = mRootView.findViewById(R.id.spin_issue);
        resetlist = mRootView.findViewById(R.id.reset_list);
        mSearchView = mRootView.findViewById(R.id.edittext_search);

        noResultImg = mRootView.findViewById(R.id.noResultImg);

        mRecyclerViewQuotationList = mRootView.findViewById(R.id.recycler_quotation_list);
        lnlFocRequest = mRootView.findViewById(R.id.lnlFocRequest);

        recyclerTouchListener = this;
        fragment = this;

        mFOCListAdapter = new FOCListAdapter(getContext(), mGetFOCLists, recyclerTouchListener);
        mLayoutManager = new LinearLayoutManager(getContext(), LinearLayoutManager.VERTICAL, false);
        mRecyclerViewQuotationList.setLayoutManager(mLayoutManager);
        mRecyclerViewQuotationList.setItemAnimator(new DefaultItemAnimator());
        mRecyclerViewQuotationList.setAdapter(mFOCListAdapter);
        mFOCListAdapter.notifyDataSetChanged();
        mFOCListAdapter.setClickListener(recyclerTouchListener);
        plusFocReq = mRootView.findViewById(R.id.plusFocReq);

        if (mUserGroup == Constant.UserGroupId.OWNERID || mUserGroup == Constant.UserGroupId.SUBADMIN || mUserGroup == Constant.UserGroupId.ZONEHEAD || mUserGroup == Constant.UserGroupId.MANAGER) {
            mSearchView.setVisibility(View.VISIBLE);
            plusFocReq.setVisibility(View.GONE);
        } else if (mUserGroup == Constant.UserGroupId.FIELDWORKERID) {
            mSearchView.setVisibility(View.GONE);
            plusFocReq.setVisibility(View.VISIBLE);
        }

        mRecyclerViewQuotationList.addOnScrollListener(new PaginationScrollListener(mLayoutManager) {
            @Override
            protected void loadMoreItems() {
                isLoading = true;
                mCurrentPage += 1;
                if (!isLastPage) {
                    // mocking network delay for API call
                    new Handler().postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            FWLogger.logInfo(TAG, "loadNextPage()");
                            isLoadFirstTime = false;
                            loadNextPage();
                        }
                    }, 1000);
                }
            }

            @Override
            public int getTotalPageCount() {
                return TOTAL_PAGES;
            }

            @Override
            public boolean isLastPage() {
                return isLastPage;
            }

            @Override
            public boolean isLoading() {
                return isLoading;
            }
        });

        mSearchParam = "";
        mockingNetworkDelay(mSearchParam, mTaskTypeId, mTaskStatusId);

        AutoCompleteTextView search_text = (AutoCompleteTextView) mSearchView.findViewById(mSearchView.getContext().getResources().getIdentifier("android:id/search_src_text", null, null));
        search_text.setTextSize(TypedValue.COMPLEX_UNIT_PX, getResources().getDimensionPixelSize(R.dimen.list_title));
        search_text.setGravity(Gravity.CENTER_VERTICAL);
        InputFilter[] filterArray = new InputFilter[1];
        filterArray[0] = new InputFilter.LengthFilter(10);
        search_text.setFilters(filterArray);
        mSearchView.setGravity(Gravity.CENTER_VERTICAL);
        SearchManager searchManager = (SearchManager) getActivity().getSystemService(Context.SEARCH_SERVICE);
        mSearchView.setSearchableInfo(searchManager.getSearchableInfo(getActivity().getComponentName()));
        mSearchView.setIconified(false);
        mSearchView.clearFocus();

        mSearchView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mSearchView.setIconified(false);
                mSearchView.setFocusable(true);
            }
        });
        setSearchFilter();

        plusFocReq.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                try {
                    ((HomeActivityNew) getActivity()).loadFragment(new TaskRequestItems_FW(), R.id.navigation_home);
                } catch (Exception e) {
                    e.getMessage();
                }
            }
        });

        ///////////////////////////////////////////TASK TAG LIST//////////////////////////////////////////////

        SpinTaskTag.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // Initialize dialog
                FWDialog dialog = new FWDialog(getActivity(), R.style.DialogSlideAnim);
                Dialog searchDialog = new Dialog(dialog.getContext());
                // set custom dialog
                searchDialog.setContentView(R.layout.dialog_searchable_spinner_status_tag);
                // set custom height and width
                searchDialog.getWindow().setLayout(800, 1000);
                // set transparent background
                searchDialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
                // show dialog
                searchDialog.show();
                // Initialize and assign variable
                EditText editText = searchDialog.findViewById(R.id.edit_textSearch);
                ListView listView = searchDialog.findViewById(R.id.list_view);
                // Initialize array adapter
                ArrayAdapter<String> arrayAdapterTaskTag = new ArrayAdapter<String>(getActivity(), android.R.layout.simple_list_item_1, ((HomeActivityNew) getActivity()).mFOCStatusTagName);
                // set adapter
                listView.setAdapter(arrayAdapterTaskTag);
                editText.addTextChangedListener(new TextWatcher() {
                    @Override
                    public void beforeTextChanged(CharSequence s, int start, int count, int after) {

                    }

                    @Override
                    public void onTextChanged(CharSequence s, int start, int before, int count) {
                        arrayAdapterTaskTag.getFilter().filter(s);
                    }

                    @Override
                    public void afterTextChanged(Editable s) {

                    }
                });

                listView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
                    @Override
                    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                        try {
                            for (int i = 0; i < ((HomeActivityNew) getActivity()).mStatusTagList.size(); i++) {
                                if (arrayAdapterTaskTag.getItem(position).equals(((HomeActivityNew) getActivity()).mStatusTagList.get(i).getFocStatusName())) {
                                    mTaskTagId = ((HomeActivityNew) getActivity()).mStatusTagList.get(i).getFocStatusId();
                                    assignedTaskTagName = ((HomeActivityNew) getActivity()).mStatusTagList.get(i).getFocStatusName();
                                    SpinTaskTag.setText(assignedTaskTagName);
                                    clearTaskList();
                                    mSearchParam = "";
                                    getFOCList(mSearchParam, 1, mTaskTagId, issueTypeId);
                                    break;
                                }
                            }
                        } catch (Exception ex) {
                            ex.getMessage();
                        }
                        searchDialog.dismiss();
                    }
                });
            }
        });

        // STATUS SPINNER--------
        spin_issue.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // Initialize dialog
                FWDialog dialog = new FWDialog(getActivity(), R.style.DialogSlideAnim);
                Dialog searchDialog = new Dialog(dialog.getContext());
                // set custom dialog
                searchDialog.setContentView(R.layout.dialog_searchable_foc_issue);
                // set custom height and width
                searchDialog.getWindow().setLayout(800, 1000);
                // set transparent background
                searchDialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
                // show dialog
                searchDialog.show();
                // Initialize and assign variable
                EditText editText = searchDialog.findViewById(R.id.edit_textSearch);
                ListView listView = searchDialog.findViewById(R.id.list_view);
                List<String> mStrListIssue = new ArrayList<String>();
                mStrListIssue.add("Yes");
                mStrListIssue.add("No");
                // Initialize array adapter
                ArrayAdapter<String> arrayAdapterTaskTag = new ArrayAdapter<String>(getActivity(), android.R.layout.simple_list_item_1, mStrListIssue);
                // set adapter
                listView.setAdapter(arrayAdapterTaskTag);
                editText.addTextChangedListener(new TextWatcher() {
                    @Override
                    public void beforeTextChanged(CharSequence s, int start, int count, int after) {

                    }

                    @Override
                    public void onTextChanged(CharSequence s, int start, int before, int count) {
                        arrayAdapterTaskTag.getFilter().filter(s);
                    }

                    @Override
                    public void afterTextChanged(Editable s) {

                    }
                });

                listView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
                    @Override
                    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                        try {
                            for (int i = 0; i < mStrListIssue.size(); i++) {
                                if (arrayAdapterTaskTag.getItem(position).equals(mStrListIssue.get(i))) {
                                    if (mStrListIssue.get(i).equals("Yes")) {
                                        issueTypeId = 1;
                                        issueTypeName = arrayAdapterTaskTag.getItem(position);
                                    } else if (mStrListIssue.get(i).equals("No")) {
                                        issueTypeId = 2;
                                        issueTypeName = arrayAdapterTaskTag.getItem(position);
                                    }
                                    spin_issue.setText(issueTypeName);
                                    clearTaskList();
                                    mSearchParam = "";
                                    getFOCList(mSearchParam, 1, mTaskTagId, issueTypeId);
                                    break;
                                }
                            }
                        } catch (Exception ex) {
                            ex.getMessage();
                        }
                        searchDialog.dismiss();
                    }
                });
            }
        });


        // NEW SEARCHABLE SPINNER ----------------END---

        resetlist.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                SpinTaskTag.setText("Status Tag");
                spin_issue.setText("Issue");
                AppCompatActivity activity = (AppCompatActivity) getActivity();
                ItemInventoryTabHost myFragment = new ItemInventoryTabHost();
                activity.getSupportFragmentManager().beginTransaction().replace(R.id.home_fragment_container, myFragment).commit();
            }
        });

       /* mRecyclerTouchListener = new RecyclerTouchListener() {
            @Override
            public void onClick(View view, int position) {
                try {
                    FOCDetails_UpdateFragmnt focDetailsUpdateFragmnt = new FOCDetails_UpdateFragmnt();
                    Bundle bundle = new Bundle();
                    GetFOCList.ResultData data = mQuotationList.get(position);
                    bundle.putSerializable("FOC_REQ_DETAILS", data);
                    focDetailsUpdateFragmnt.setArguments(bundle);
                    getActivity().getSupportFragmentManager().beginTransaction().replace(R.id.home_fragment_container, focDetailsUpdateFragmnt).addToBackStack(null).commit();
                } catch (Exception ex) {
                    ex.getMessage();
                }
            }
        };

        mFOCListAdapter.setClickListener(mRecyclerTouchListener);*/


        return mRootView;
    }

    private void mockingNetworkDelay(String searchParam, int typeId, int statusId) {
        // mocking network delay for API call
        Log.d(TAG, "mockingNetworkDelay: " + mCurrentPage);
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                getFOCList(searchParam, mCurrentPage, 0, issueTypeId);
            }
        }, 1000);
    }

    private void loadNextPage() {
        Log.d(TAG, "loadNextPage: " + mCurrentPage);
        getFOCList(mSearchParam, mCurrentPage, 0, issueTypeId);
    }

    public void getItemsIssueList() {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                int userID = SharedPrefManager.getInstance(getApplicationContext()).getUserId();
                Call<ItemIssueList> call = RetrofitClient.getInstance(getApplicationContext()).getMyApi().getItemIssueList(userID);
                call.enqueue(new retrofit2.Callback<ItemIssueList>() {
                    @Override
                    public void onResponse(Call<ItemIssueList> call, Response<ItemIssueList> response) {
                        try {
                            if (response.code() == 200) {

                                ItemIssueList itemIssueList = response.body();
                                mItemsIssueLists = new ArrayList<>();
                                mItemsIssueLists = itemIssueList.getResultData();
                                ownerID = mItemsIssueLists.get(0).getOwnerId();
                                mItemsIssueNameList = new ArrayList<>();
                                for (ItemIssueList.ResultData resultData : mItemsIssueLists) {
                                    mItemsIssueNameList.add(resultData.getName());
                                }
                                getItemListTech();
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<ItemIssueList> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in GetAssignedItemsListByUserId? API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in GetAssignedItemsListByUserId? API:");
            ex.getMessage();
        }
    }

    public void getItemListTech() {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                Call<ItemsList> call = RetrofitClient.getInstance(getApplicationContext()).getMyApi().getItemList(ownerID);
                call.enqueue(new retrofit2.Callback<ItemsList>() {
                    @Override
                    public void onResponse(Call<ItemsList> call, Response<ItemsList> response) {
                        try {
                            if (response.code() == 200) {
                                ItemsList itemsList = response.body();
                                mItemsListsTech = new ArrayList<>();
                                mItemsListsTech = itemsList.getResultData();
                                mItemsNameList = new ArrayList<>();

                                for (ItemsList.ResultData resultData : mItemsListsTech) {
                                    mItemsNameList.add(resultData.getName());
                                }
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<ItemsList> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in AllItemListAssignAndUnAssignV2 API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in AllItemListAssignAndUnAssignV2 API:");
            ex.getMessage();
        }
    }

    public void getFOCList(String mSearchParam, int mCurrentPage, int focTagId, int issueTypeId) {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                int userID = SharedPrefManager.getInstance(getApplicationContext()).getUserId();
                zoneID = SharedPrefManager.getInstance(getApplicationContext()).getAssignZoneId();
                if (zoneID == 0) {
                    zoneID = 0;
                }
                Call<GetFOCList> call = RetrofitClient.getInstance(getApplicationContext()).getMyApi().getFOCList(mCurrentPage, 10, zoneID, userID, issueTypeId, focTagId, mSearchParam, "Bearer " + SharedPrefManager.getInstance(getActivity()).getUserToken());
                call.enqueue(new retrofit2.Callback<GetFOCList>() {
                    @Override
                    public void onResponse(Call<GetFOCList> call, Response<GetFOCList> response) {
                        try {
                            if (response.code() == 200) {
                                mQuotationList = new ArrayList<>();
                                GetFOCList GetFOCList = response.body();
                                mQuotationList = GetFOCList.getResultData();
                                if (mSearchFilter && mQuotationList.size() == 0) {
                                    mquotationListAdapter.removeLoadingFooter();
                                    mRecyclerViewQuotationList.setVisibility(View.GONE);
                                    noResultImg.setVisibility(View.VISIBLE);
                                    noResultImg.setImageDrawable(getContext().getResources().getDrawable(R.drawable.ic_noresultfound));
                                } else {
                                    setResults(GetFOCList);
                                }
                                mSearchFilter = false;
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<GetFOCList> call, Throwable throwable) {
                        // CommonFunction.hideProgressDialog(getActivity());
                        FWLogger.logInfo(TAG, "Exception in GetQuotationsSearchByParam API:");
                    }
                });
            } else {
                //CommonFunction.hideProgressDialog(getActivity());
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            // CommonFunction.hideProgressDialog(getActivity());
            FWLogger.logInfo(TAG, "Exception in GetQuotationsSearchByParam API:");
            ex.getMessage();
        }
    }

    private void setResults(GetFOCList GetFOCList) {
        mGetFOCLists = new ArrayList<>();
        mGetFOCLists = GetFOCList.getResultData();
        if (isLoadFirstTime) {
            if (mGetFOCLists == null || mGetFOCLists.isEmpty() || mGetFOCLists.size() <= 0) {
                mRecyclerViewQuotationList.setVisibility(View.GONE);
                noResultImg.setVisibility(View.VISIBLE);
                noResultImg.setImageDrawable(getContext().getResources().getDrawable(R.drawable.ic_noresultfound));
                isLoading = false;
                isLastPage = true;
            } else {
                mRecyclerViewQuotationList.setVisibility(View.VISIBLE);
                mFOCListAdapter.addAll(mGetFOCLists);
                mFOCListAdapter.notifyDataSetChanged();
                mFOCListAdapter.addLoadingFooter();
            }
        } else {
            if (mGetFOCLists == null || mGetFOCLists.isEmpty() || mGetFOCLists.size() <= 0) {
                mFOCListAdapter.removeLoadingFooter();
                isLoading = false;
                isLastPage = true;
            } else {
                mFOCListAdapter.removeLoadingFooter();
                isLoading = false;
                mFOCListAdapter.addAll(mGetFOCLists);
                mFOCListAdapter.notifyDataSetChanged();
                mFOCListAdapter.addLoadingFooter();
            }
        }
    }

    public void clearTaskList() {
        try {
            int size = mGetFOCLists.size();
            mGetFOCLists.clear();
            mFOCListAdapter.notifyItemRangeRemoved(0, size);
            // For loading data after selecting task type from spinner
            isLoadFirstTime = true;
            mCurrentPage = PAGE_START;
            isLoading = false;
            isLastPage = false;
            mSearchParam = "";

            mFOCListAdapter = new FOCListAdapter(getContext(), mGetFOCLists, recyclerTouchListener);
            mRecyclerViewQuotationList.setAdapter(mFOCListAdapter);
            mFOCListAdapter.setClickListener(recyclerTouchListener);
            mFOCListAdapter.notifyDataSetChanged();
        } catch (Exception ex) {
            ex.getMessage();
        }
    }

    /*private void setSearchFilter() {
        // listening to search query text change
        mSearchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                if (query != null && isValidPhone(query)) {
                    if (mGetFOCLists != null) clearTaskList();
                    mTextViewRefresh.setVisibility(View.GONE);
                    mSearchParam = query;
                    mSearchFilter = true;
                    mockingNetworkDelay(query, 0, 0);
                } else {
                    Toast.makeText(getContext(), R.string.please_enter_valid_contact_number, Toast.LENGTH_SHORT).show();
                }

                return false;
            }

            @Override
            public boolean onQueryTextChange(String query) {
                return false;
            }
        });
        mSearchView.setOnCloseListener(new SearchView.OnCloseListener() {
            @Override
            public boolean onClose() {
                mSearchView.clearFocus();
                return false;
            }

        });
    }*/

    private boolean isValidPhone(String phone) {
        /*return phone.length() == 10;*/
        return phone.length() >= 7;
    }

    @Override
    public void onResume() {
        FWLogger.logInfo(TAG, "OnResume");
        super.onResume();
    }

    @Override
    public void onAttach(Context context) {
        FWLogger.logInfo(TAG, "onAttach");
        super.onAttach(context);
    }

    @Override
    public void onDetach() {
        FWLogger.logInfo(TAG, "onDetach");
        super.onDetach();
    }

    @Override
    public void onPause() {
        FWLogger.logInfo(TAG, "onPause");
        super.onPause();
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        FWLogger.logInfo(TAG, "onCreate");
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
    }

    @Override
    public void onDateSet(DatePicker view, int year, int month, int dayOfMonth) {
        mDay = dayOfMonth;
        mMonth = month;
        mYear = year;
        FWLogger.logInfo(TAG, "mMonth : " + mMonth + " " + mYear);

        if (mTaskTypeId == 0 && mTaskStatusId == 0 && mMonth == ((HomeActivityNew) getActivity()).currentMonth)
            isAllData = false;
        else isAllData = true;

        if (mGetFOCLists != null && getContext() != null) clearTaskList();

        currentMonthName = DateUtils.getMonthName(mMonth);
        ((HomeActivityNew) getActivity()).mEditTextYearMonth.setText(currentMonthName + " " + mYear);

        //getFOCList("",1,0);
    }

    private void setSearchFilter() {
        // listening to search query text change
        mSearchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                // filter recycler view when query submitted
                if (mquotationListAdapter != null) clearTaskList();
                mSearchParam = query;
                mSearchFilter = true;
                mockingNetworkDelay(query, 0, 0);
                return false;
            }

            @Override
            public boolean onQueryTextChange(String query) {
                return false;
            }
        });
        mSearchView.setOnCloseListener(new SearchView.OnCloseListener() {
            @Override
            public boolean onClose() {
                mSearchView.clearFocus();
                return false;
            }
        });
    }

    public void DeleteUsedItemsDialog(Context context, int focRequestedID, Activity mActivity) {
        FWDialog dialog = new FWDialog(context, R.style.DialogSlideAnim);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(false);
        dialog.setContentView(R.layout.delete_foc_requested_item);
        dialog.getWindow().setGravity(Gravity.BOTTOM);

        Button btnDeleteFoc, btnNotYet;

        btnDeleteFoc = dialog.findViewById(R.id.btnDeleteFoc);
        btnNotYet = dialog.findViewById(R.id.btnNotYet);
        btnDeleteFoc.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                DeleteFOCReqItem(focRequestedID, context, mActivity);
                dialog.dismiss();
            }
        });

        btnNotYet.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                dialog.dismiss();
            }
        });

        dialog.show();
    }

    public void DeleteFOCReqItem(int focReqId, Context mcontext, Activity mActivity) {
        try {
            if (Connectivity.isNetworkAvailableRetro(mActivity)) {
                Call<GetDeleteFOCReqItem> call = RetrofitClient.getInstance(mcontext).getMyApi().getDeleteFOCReqItem(focReqId, "Bearer " + SharedPrefManager.getInstance(getContext()).getUserToken());
                call.enqueue(new retrofit2.Callback<GetDeleteFOCReqItem>() {
                    @Override
                    public void onResponse(Call<GetDeleteFOCReqItem> call, Response<GetDeleteFOCReqItem> response) {
                        try {
                            if (response.code() == 200) {
                                GetDeleteFOCReqItem deleteFOCReqItem = response.body();
                                CommonFunction.showSuccessMsg(deleteFOCReqItem.getMessage(), mActivity);
                                refresh(mcontext);
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<GetDeleteFOCReqItem> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in DeleteFOC_Request_Items_Details API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(mActivity);
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in DeleteFOC_Request_Items_Details API:");
            ex.getMessage();
        }
    }

    public void DeleteFOCReqSubItem(int focReqId, Context mcontext, Activity mActivity) {
        try {
            if (Connectivity.isNetworkAvailableRetro(mActivity)) {
                Call<GetDeleteFOCReqItem> call = RetrofitClient.getInstance(mcontext).getMyApi().getDeleteFOCReqSubItem(focReqId, "Bearer " + SharedPrefManager.getInstance(getContext()).getUserToken());
                call.enqueue(new retrofit2.Callback<GetDeleteFOCReqItem>() {
                    @Override
                    public void onResponse(Call<GetDeleteFOCReqItem> call, Response<GetDeleteFOCReqItem> response) {
                        try {
                            if (response.code() == 200) {
                                GetDeleteFOCReqItem deleteFOCReqItem = response.body();
                                CommonFunction.showSuccessMsg(deleteFOCReqItem.getMessage(), mActivity);
                                refresh(mcontext);
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<GetDeleteFOCReqItem> call, Throwable throwable) {
                        FWLogger.logInfo(TAG, "Exception in DeleteFOC_Request_Items_Details API:");
                    }
                });
            } else {
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(mActivity);
            }
        } catch (Exception ex) {
            FWLogger.logInfo(TAG, "Exception in DeleteFOC_Request_Items_Details API:");
            ex.getMessage();
        }
    }


    private void refresh(Context mContext) {
        AppCompatActivity activity = (AppCompatActivity) mContext;
        ItemInventoryTabHost myFragment = new ItemInventoryTabHost();
        activity.getSupportFragmentManager().beginTransaction().replace(R.id.home_fragment_container, myFragment).addToBackStack(null).commit();
    }


    @Override
    public void onDestroyView() {
        FWLogger.logInfo(TAG, "onDestroyView");
        CommonFunction.hideProgressDialog(getActivity());
        ((HomeActivityNew) getActivity()).textViewUsername.setVisibility(View.VISIBLE);
        //mSearchView.setVisibility(View.GONE);
        ((HomeActivityNew) getActivity()).mLinearHeaderLayout.setVisibility(View.GONE);
        ((HomeActivityNew) getActivity()).textViewUsername.setVisibility(View.VISIBLE);
//        ((HomeActivityNew) getActivity()).mSpinnerMonthYear.setVisibility(View.GONE);
        ((HomeActivityNew) getActivity()).mEditTextYearMonth.setVisibility(View.GONE);
//        ((HomeActivityNew) getActivity()).getMonthYearList();
        clearTaskList();
        super.onDestroyView();
    }

    @Override
    public void onDestroy() {
        FWLogger.logInfo(TAG, "onDestroy");
        super.onDestroy();
    }

    @Override
    public void onActivityCreated(@Nullable Bundle savedInstanceState) {
        FWLogger.logInfo(TAG, "onActivityCreated");
        super.onActivityCreated(savedInstanceState);
    }

    @Override
    public void onStart() {
        FWLogger.logInfo(TAG, "onStart");
        super.onStart();
    }

    @Override
    public void onStop() {
        FWLogger.logInfo(TAG, "onStop");
        super.onStop();
    }

    // Recycler Touch Listener override method
    @Override
    public void onClick(View view, int position) {

    }
}