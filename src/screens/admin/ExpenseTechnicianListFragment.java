package com.corefield.fieldweb.FieldWeb.Admin;

import android.app.SearchManager;
import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.SearchView;
import android.widget.Toast;

import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.corefield.fieldweb.Adapter.ExpenseTechListAdapter;
import com.corefield.fieldweb.AsyncManager.OnTaskCompleteListener;
import com.corefield.fieldweb.BuildConfig;
import com.corefield.fieldweb.DTO.Expenditure.ExpenseTechList;
import com.corefield.fieldweb.FieldWeb.Dialogs.ServiceDialog;
import com.corefield.fieldweb.FieldWeb.HomeActivityNew;
import com.corefield.fieldweb.Listener.RecyclerTouchListener;
import com.corefield.fieldweb.Network.URLConnectionResponse;
import com.corefield.fieldweb.R;
import com.corefield.fieldweb.Retrofit.RetrofitClient;
import com.corefield.fieldweb.Util.CommonFunction;
import com.corefield.fieldweb.Util.Connectivity;
import com.corefield.fieldweb.Util.DateUtils;
import com.corefield.fieldweb.Util.FWLogger;
import com.corefield.fieldweb.Util.FirebaseGoogleAnalytics;
import com.corefield.fieldweb.Util.SharedPrefManager;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.gson.Gson;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Response;

/**
 * Fragment Controller for ExpenseTechnicianListFragment
 *
 * @author CoreField
 * @version 1.1
 * @implNote This Fragment class is used for to show Technician list with their opening Amount
 */
public class ExpenseTechnicianListFragment extends Fragment implements OnTaskCompleteListener, RecyclerTouchListener, View.OnClickListener {
    protected static String TAG = ExpenseTechnicianListFragment.class.getSimpleName();
    private View mRootView;
    private RecyclerView mRecyclerViewUsersList;
    private Button mBalance;
    private int mPosition;
    private ExpenseTechListAdapter mExpenseTechListAdapter;
    private RecyclerView.LayoutManager mLayoutManager;
    private List<ExpenseTechList.ResultData> mExpenseTechList = null;
    private SearchView mSearchView;
    RecyclerTouchListener recyclerTouchListener;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        mRootView = inflater.inflate(R.layout.fragment_employee_list_new, container, false);
        inIt();
        return mRootView;
    }

    private void inIt() {
        mBalance = mRootView.findViewById(R.id.plus_balance);
        mRecyclerViewUsersList = mRootView.findViewById(R.id.recycler_user_list);
        recyclerTouchListener = this::onClick;
        /*mExpenseTechListAsyncTask = new ExpenseTechListAsyncTask(getContext(), BaseAsyncTask.Priority.LOW, this);
        mExpenseTechListAsyncTask.execute(SharedPrefManager.getInstance(getContext()).getUserId());*/
        getTechnicianList();

    }

    @Override
    public void onTaskComplete(URLConnectionResponse urlConnectionResponse, String classType) {
        if (classType.equalsIgnoreCase(ExpenseTechList.class.getSimpleName())) {
            FWLogger.logInfo(TAG, "List added Successfully");
            Gson gson = new Gson();
            mExpenseTechList = new ArrayList<>();
            ExpenseTechList expenseTechList = gson.fromJson(urlConnectionResponse.resultData, ExpenseTechList.class);
            mExpenseTechList = expenseTechList.getResultData();
            mLayoutManager = new LinearLayoutManager(getActivity());
            mRecyclerViewUsersList.setLayoutManager(mLayoutManager);
            mExpenseTechListAdapter = new ExpenseTechListAdapter(getActivity(), mPosition, mExpenseTechList);
            mExpenseTechListAdapter.setClickListener(this);
            mRecyclerViewUsersList.setAdapter(mExpenseTechListAdapter);

            setSearchFilter();
            mBalance.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    ((HomeActivityNew) getActivity()).addDeductBalance();
                }
            });
        }
    }

    @Override
    public void onClick(View view, int position) {
        //NOTE: Log GA event
        Bundle bundle = new Bundle();
        bundle.putInt(FirebaseGoogleAnalytics.Param.USER_ID, SharedPrefManager.getInstance(getContext()).getUserId());
        bundle.putString(FirebaseGoogleAnalytics.Param.VERSION_NAME, BuildConfig.VERSION_NAME);
        bundle.putString(FirebaseGoogleAnalytics.Param.USER_TYPE, SharedPrefManager.getInstance(getContext()).getUserGroup());
        bundle.putString(FirebaseGoogleAnalytics.Param.TIME_STAMP, DateUtils.getDateForWithGAFormat());
        bundle.putString(FirebaseGoogleAnalytics.Param.PLATFORM, FirebaseGoogleAnalytics.Defaults.PLATFORM_ANDROID);
        bundle.putInt(FirebaseGoogleAnalytics.Param.TECH_ID, mExpenseTechList.get(position).getUserId());
        bundle.putInt(FirebaseGoogleAnalytics.Param.BALANCE, mExpenseTechList.get(position).getRemainingBalance());
        FirebaseAnalytics.getInstance(getContext()).logEvent(FirebaseGoogleAnalytics.Event.EXP_TECHNICIAN, bundle);

        /*FragmentManager fragmentManager = getFragmentManager();
        ExpenseDetailsFragment expenseDetailsFragment = new ExpenseDetailsFragment();
        Bundle expenseBundle = new Bundle();
        expenseBundle.putSerializable("expenseResult", mExpenseTechListAdapter.getItem(position));
        expenseDetailsFragment.setArguments(expenseBundle);
        FragmentTransaction fragmentTransaction = fragmentManager.beginTransaction();
        fragmentTransaction.replace(R.id.home_task_frag_layout, expenseDetailsFragment, "ExpenseDetails Details");
        fragmentTransaction.addToBackStack(null);
        fragmentTransaction.commit();*/

        ExpenseDetailsFragment expenseDetailsFragment = new ExpenseDetailsFragment();
        Bundle expenseBundle = new Bundle();
        expenseBundle.putSerializable("expenseResult", mExpenseTechListAdapter.getItem(position));
        expenseDetailsFragment.setArguments(expenseBundle);
        getActivity().getSupportFragmentManager().beginTransaction()
                .replace(R.id.home_fragment_container, expenseDetailsFragment).addToBackStack(null).commit();

        /*switch (view.getId()) {*/
        int id = view.getId();
        if (id == R.id.edittext_search) {
            //case R.id.edittext_search:
                mSearchView.setIconified(false);
                mSearchView.setFocusable(true);
                //break;
        }
    }

    private void setSearchFilter() {
        // Associate searchable configuration with the SearchView
        SearchManager searchManager = (SearchManager) getActivity().getSystemService(Context.SEARCH_SERVICE);
        mSearchView = mRootView.findViewById(R.id.edittext_search);
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        p.weight = 1;
        mSearchView.setLayoutParams(p);

        mSearchView.setSearchableInfo(searchManager.getSearchableInfo(getActivity().getComponentName()));
        mSearchView.setMaxWidth(Integer.MAX_VALUE);
        mSearchView.setIconified(false);
        mSearchView.clearFocus();
        mSearchView.setOnClickListener(this);
        // listening to search query text change
        mSearchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                // filter recycler view when query submitted
                mExpenseTechListAdapter.getFilter().filter(query);
                return false;
            }

            @Override
            public boolean onQueryTextChange(String query) {
                // filter recycler view when text is changed
                mExpenseTechListAdapter.getFilter().filter(query);
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

    @Override
    public void onDestroyView() {
        /*if (mExpenseTechListAsyncTask != null) mExpenseTechListAsyncTask.cancel(true);*/
        super.onDestroyView();
    }

    @Override
    public void onClick(View v) {

    }

    public void getTechnicianList() {
        try {
            if (Connectivity.isNetworkAvailableRetro(getActivity())) {
                CommonFunction.showProgressDialog(getActivity());
                int userID = SharedPrefManager.getInstance(getContext()).getUserId();
                Call<ExpenseTechList> call = RetrofitClient.getInstance(getContext()).getMyApi().getTechnicianList(userID);
                call.enqueue(new retrofit2.Callback<ExpenseTechList>() {
                    @Override
                    public void onResponse(Call<ExpenseTechList> call, Response<ExpenseTechList> response) {
                        try {
                            if (response.code() == 200) {
                                CommonFunction.hideProgressDialog(getActivity());
                                ExpenseTechList expenseTechList = response.body();
                                FWLogger.logInfo(TAG, "List added Successfully");
                                mExpenseTechList = new ArrayList<>();
                                mExpenseTechList = expenseTechList.getResultData();
                                mLayoutManager = new LinearLayoutManager(getActivity());
                                mRecyclerViewUsersList.setLayoutManager(mLayoutManager);

                                mExpenseTechListAdapter = new ExpenseTechListAdapter(getActivity(), mPosition, mExpenseTechList);
                                mExpenseTechListAdapter.setClickListener(recyclerTouchListener);
                                mRecyclerViewUsersList.setAdapter(mExpenseTechListAdapter);

                                setSearchFilter();
                                mBalance.setOnClickListener(new View.OnClickListener() {
                                    @Override
                                    public void onClick(View view) {
                                        ((HomeActivityNew) getActivity()).addDeductBalance();
                                    }
                                });
                            }
                        } catch (Exception e) {
                            e.getMessage();
                        }
                    }

                    @Override
                    public void onFailure(Call<ExpenseTechList> call, Throwable throwable) {
                        CommonFunction.hideProgressDialog(getActivity());
                        FWLogger.logInfo(TAG, "Exception in GetTechnicianList API:");
                    }
                });
            } else {
                CommonFunction.hideProgressDialog(getActivity());
                ServiceDialog serviceDialog = ServiceDialog.getInstance();
                serviceDialog.noConnectionDialogRetro(getActivity());
            }
        } catch (Exception ex) {
            CommonFunction.hideProgressDialog(getActivity());
            FWLogger.logInfo(TAG, "Exception in GetTechnicianList API:");
            ex.getMessage();
        }
    }
}