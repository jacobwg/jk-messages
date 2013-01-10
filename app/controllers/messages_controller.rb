class MessagesController < ApplicationController

  respond_to :html, :json

  def index
    @last_day = Message.last.time_cst.to_date
    @day = !params[:day].nil? ? Date.parse(params[:day]) : @last_day

    @first_day = Date.parse('2012-08-13')

    all_days = (@first_day..@last_day).to_a
    sent_days = Message.all.map { |m| m.time_cst.to_date }
    @unsent_days = all_days - sent_days

    @messages = Message.where(['time >= ? and time <= ?', @day.to_time.beginning_of_day, @day.to_time.end_of_day])

    respond_with @messages
  end

  def search
    if params[:q]
      @last_day = Message.last.time_cst.to_date
      @query = params[:q]
      @messages = Message.search(params)
      respond_with @messages
    else
      redirect_to :root
    end
  end

end
