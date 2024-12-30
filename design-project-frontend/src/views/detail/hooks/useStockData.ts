import { ref } from 'vue';
import { request } from '@/service/request';

interface StockDetailData {
  stockCode: string;
  stockName: string;
  latestPrice: string;
  priceChangeRate: string;
  priceChange: string;
  riseSpeed: string;
  ratingOrgNum: number;
  ratingBuyNum: number;
  ratingAddNum: number;
  ratingNeutralNum: number;
  ratingReduceNum: number;
  ratingSaleNum: number;
  year1: number;
  eps1: number;
  year2: number;
  eps2: number;
  year3: number;
  eps3: number;
  year4: number;
  eps4: number;
}

interface RatingData {
  ratingBuyNum: number;
  ratingAddNum: number;
  ratingNeutralNum: number;
  ratingReduceNum: number;
  ratingSaleNum: number;
}

interface StockInfoData {
  stockCode: string;
  summary: string;
  financialDataByYear: Record<string, any>;
}

export function useStockData() {
  const stockDetailData = ref<StockDetailData>({} as StockDetailData);
  const stockInfoData = ref<StockInfoData>({} as StockInfoData);
  const ratingData = ref<RatingData>({} as RatingData);
  ratingData.value = {
    ratingBuyNum: stockDetailData.value.ratingBuyNum,
    ratingAddNum: stockDetailData.value.ratingAddNum,
    ratingNeutralNum: stockDetailData.value.ratingNeutralNum,
    ratingReduceNum: stockDetailData.value.ratingReduceNum,
    ratingSaleNum: stockDetailData.value.ratingSaleNum
  };

  const klineData = ref([]);
  const sentimentData = ref([]);
  const wordFreqData = ref([]);
  const correlationData = ref([]);

  async function fetchStockFinancialData(stockCode: string) {
    try {
      const result = await request({
        url: '/stock/financial_data',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          stockCode
        },
        method: 'GET'
      });
      if (result?.data) {
        stockInfoData.value = result.data;
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  }

  async function fetchStockDetailData(stockCode: string) {
    try {
      const result = await request({
        url: '/stock',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          stockCode
        },
        method: 'GET'
      });
      if (result?.data) {
        stockDetailData.value = result.data;
      }
    } catch (error) {
      console.error('Error fetching stock detail:', error);
    }
  }

  async function fetchKlineData(stockCode: string) {
    try {
      const result = await request({
        url: '/stock/kline',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          stockCode
        },
        method: 'GET'
      });
      if (result) {
        klineData.value = result.data;
      }
    } catch (error) {
      console.error('Error fetching kline data:', error);
    }
  }

  async function fetchSentimentData(stockCode: string) {
    try {
      const result = await request({
        url: '/stock/sentiment',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          stockCode
        },
        method: 'GET'
      });
      if (result) {
        sentimentData.value = result.data;
      }
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
    }
  }

  async function fetchWordFrequencyData(stockCode: string) {
    try {
      const result = await request({
        url: '/stock/word-frequency',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          stockCode
        },
        method: 'GET'
      });
      if (result) {
        wordFreqData.value = result.data;
      }
    } catch (error) {
      console.error('Error fetching word frequency data:', error);
    }
  }

  async function fetchSentimentCorrelation(stockCode: string) {
    try {
      const result = await request({
        url: '/stock/sentiment-correlation',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          stockCode
        },
        method: 'GET'
      });
      if (result) {
        correlationData.value = result.data;
      }
    } catch (error) {
      console.error('Error fetching correlation data:', error);
    }
  }

  return {
    stockDetailData,
    stockInfoData,
    klineData,
    sentimentData,
    wordFreqData,
    correlationData,
    fetchStockFinancialData,
    fetchStockDetailData,
    fetchKlineData,
    fetchSentimentData,
    fetchWordFrequencyData,
    fetchSentimentCorrelation
  };
}