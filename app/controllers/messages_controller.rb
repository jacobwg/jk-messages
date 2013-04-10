class MessagesController < ApplicationController

  before_filter :validate

  respond_to :html, :json

  layout 'book', :only => :book

  def index
    @day = !params[:day].nil? ? Date.parse(params[:day]) : @last_day

    @first_day = Date.parse('2012-08-13')

    all_days = (@first_day..@last_day).to_a
    @unsent_days = all_days - @sent_days
    @unsent_days.map! { |d| [d.year, d.month, d.day] }

    @messages = Message.where(['time >= ? and time <= ?', @day.to_time.beginning_of_day, @day.to_time.end_of_day])

    respond_with @messages
  end

  def show
    @last_day = Message.last.time_cst.to_date
    @day = !params[:day].nil? ? Date.parse(params[:day]) : @last_day

    @first_day = Date.parse('2012-08-13')

    all_days = (@first_day..@last_day).to_a
    @unsent_days = all_days - @sent_days
    @unsent_days.map! { |d| [d.year, d.month, d.day] }

    @message = Message.find(params[:id])

    respond_to do |format|
      format.html
      format.pdf { render :text => PDFKit.new( message_url(@message) ).to_pdf }
    end
  end

  def search
    if params[:q]
      @hide_pagination = true
      @last_day = Message.last.time_cst.to_date
      @query = params[:q]
      @messages = Message.search(params)
      respond_with @messages
    else
      redirect_to :root
    end
  end

  def book
    @hide_pagination = true
    @last_day = Message.last.time_cst.to_date
    @messages = Message.where('DATE(CONVERT_TZ(time, "UTC", "America/Chicago")) >= ? AND DATE(CONVERT_TZ(time, "UTC", "America/Chicago")) <= ?', Date.parse('2013-02-21'), Date.parse('2013-03-20'))
    respond_with @messages
  end

  def feed
    @title = 'J K Messages'
    @messages = Message.limit(20)

    @updated = @messages.first.time_cst unless @messages.empty?

    respond_to do |format|
      format.atom { render :layout => false }
    end
  end

end
