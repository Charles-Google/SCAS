import pandas as pd
import mysql.connector
from sqlalchemy import create_engine, Table, MetaData, insert, delete
from sqlalchemy.sql import select


def main():
    process_csv_to_mysql()


def process_csv_to_mysql():
    print("将数据导入数据库...")
    # 读取CSV文件
    emotion_index_data = pd.read_csv('emotion_index.csv')
    market_style = pd.read_csv('market_style.csv')
    sectors_and_stocks = pd.read_csv('sectors_and_stocks.csv', dtype={'stock_code': str})
    top_text = pd.read_csv('top_text.csv')
    predict_data = pd.read_csv('predict.csv', dtype={'stock_code': str})
    stocks_data = pd.read_csv('stocks_data.csv', dtype={'stock_code': str})

    # 处理NaN值，将其转换为None
    predict_data = predict_data.convert_dtypes()
    predict_data = predict_data.where(pd.notnull(predict_data), None)
    # 将市场风格数据的dtype进行转换
    market_style.convert_dtypes()
    # 直接在原DataFrame上填充NaN值，不重新赋值
    market_style.fillna("", inplace=True)

    # MySQL数据库连接配置
    db_config = {
        'user': 'root',
        'password': '123456',
        'host': 'localhost',
        'database': 'stocks',
        'raise_on_warnings': True
    }

    # 清空数据表
    def clear_table(table_name):
        table = metadata.tables[table_name]
        with engine.begin() as connection:
            connection.execute(delete(table))

    # 建立MySQL连接
    engine = create_engine(
        f"mysql+mysqlconnector://{db_config['user']}:{db_config['password']}@{db_config['host']}/{db_config['database']}")

    # 获取数据库元数据
    metadata = MetaData()
    metadata.reflect(bind=engine)
    # 清空所有相关的表
    print("清空'emotion_index', 'market_style', 'sectors_and_stocks', 'top_text'表")
    tables_to_clear = ['emotion_index', 'market_style', 'sectors_and_stocks', 'top_text']
    for table_name in tables_to_clear:
        clear_table(table_name)

    print("导入'emotion_index'表")
    # emotion_index表中只有一个字段
    with engine.begin() as connection:
        # 准备插入数据到emotion_index表
        emotion_index_table = metadata.tables['emotion_index']
        with engine.begin() as connection:
            for index, row in emotion_index_data.iterrows():
                stmt = insert(emotion_index_table).values(emotion_index=row['emotion_index'])
                connection.execute(stmt)

    print("导入'market_style'表")
    # 反射market_style表
    market_style_table = Table('market_style', metadata, autoload_with=engine)

    with engine.begin() as connection:
        for index, row in market_style.iterrows():
            stmt = insert(market_style_table).values(  # name,change_rate,top_name
                name=row['name'],
                change_rate=row['change_rate'],
                top_name=row['top_name']
            )
            connection.execute(stmt)

    print("导入'sectors_and_stocks'表")
    # 反射sectors_and_stocks表 sector,reason,stock_code,stock_name
    sectors_and_stocks_table = Table('sectors_and_stocks', metadata, autoload_with=engine)
    with engine.begin() as connection:
        for index, row in sectors_and_stocks.iterrows():
            stmt = insert(sectors_and_stocks_table).values(
                sector=row['sector'],
                reason=row['reason'],
                stock_code=row['stock_code'],
                stock_name=row['stock_name']
            )
            connection.execute(stmt)

    print("导入'top_text'表")
    # 反射top_text表 position_index,title,content
    top_text_table = Table('top_text', metadata, autoload_with=engine)
    with engine.begin() as connection:
        for index, row in top_text.iterrows():
            stmt = insert(top_text_table).values(
                position_index=row['position_index'],
                title=row['title'],
                content=row['content']
            )
            connection.execute(stmt)

    print("导入'stock_info'表")
    # 反射stock_info表
    stock_info_table = Table('stock_info', metadata, autoload_with=engine)

    # 开始一个新的事务，先更新stock_info表
    with engine.begin() as connection:
        for index, row in stocks_data.iterrows():
            # 检查这个股票代码是否已经在数据库中存在
            stmt = select(stock_info_table).where(stock_info_table.columns.stock_code == row['stock_code'])
            result = connection.execute(stmt)
            if result.fetchone() is None:
                # 如果这个股票代码在数据库中不存在，那么插入新条目
                stmt = insert(stock_info_table).values(
                    stock_code=row['stock_code'],
                    stock_name=row['stock_name']
                )
            else:
                # 如果这个股票代码在数据库中已经存在，那么更新这个条目
                stmt = stock_info_table.update().where(stock_info_table.columns.stock_code == row['stock_code']).values(
                    stock_name=row['stock_name']
                )
            connection.execute(stmt)

    print("导入'stock_prices'表")
    # 反射stock_prices表
    stock_prices_table = Table('stock_prices', metadata, autoload_with=engine)

    # 开始一个新的事务，更新stock_prices表
    with engine.begin() as connection:
        for index, row in stocks_data.iterrows():
            # 检查这个股票代码是否已经在数据库中存在
            stmt = select(stock_prices_table).where(stock_prices_table.columns.stock_code == row['stock_code'])
            result = connection.execute(stmt)
            if result.fetchone() is None:
                # 如果这个股票代码在数据库中不存在，那么插入新条目
                stmt = insert(stock_prices_table).values(
                    stock_code=row['stock_code'],
                    latest_price=row['latest_price'],
                    price_change_rate=row['price_change_rate'],
                    price_change=row['price_change'],
                    rise_speed=row['rise_speed']
                )
            else:
                # 如果这个股票代码在数据库中已经存在，那么更新这个条目
                stmt = stock_prices_table.update().where(
                    stock_prices_table.columns.stock_code == row['stock_code']).values(
                    latest_price=row['latest_price'],
                    price_change_rate=row['price_change_rate'],
                    price_change=row['price_change'],
                    rise_speed=row['rise_speed']
                )
            connection.execute(stmt)
    print("导入'predict'表")
    # 反射predict表
    predict_table = Table('predict', metadata, autoload_with=engine)

    # 开始一个新的事务，更新predict表
    with engine.begin() as connection:
        for index, row in predict_data.iterrows():
            # Check if this stock_code exists in the stock_info table
            stmt = select(stock_info_table).where(stock_info_table.columns.stock_code == row['stock_code'])
            result = connection.execute(stmt)
            if result.fetchone() is not None:
                # If the stock_code exists in stock_info, insert new entry into predict table
                stmt = insert(predict_table).values(**row.to_dict())
                connection.execute(stmt)

    # 关闭连接
    engine.dispose()

    print("导入结束")